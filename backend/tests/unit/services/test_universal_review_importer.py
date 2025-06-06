import pytest
import pandas as pd
import io
from datetime import datetime
from unittest.mock import patch, MagicMock

from app.services.universal_review_importer import UniversalReviewImporter, universal_importer


class TestUniversalReviewImporter:
    """Test suite for UniversalReviewImporter class"""

    @pytest.fixture
    def importer(self):
        """Create a fresh importer instance for each test"""
        return UniversalReviewImporter()

    @pytest.fixture
    def sample_google_csv(self):
        """Sample Google My Business CSV data"""
        return """reviewer_display_name,star_rating,review_text,create_time
John Doe,5,Great service and friendly staff!,2024-01-15T10:30:00Z
Jane Smith,4,Good food but slow service,2024-01-16T14:20:00Z
Bob Johnson,1,Terrible experience would not recommend,2024-01-17T09:15:00Z
Anonymous,3,,2024-01-18T16:45:00Z"""

    @pytest.fixture
    def sample_amazon_csv(self):
        """Sample Amazon product review CSV data"""
        return """reviewer_name,star_rating,review_body,review_date,verified_purchase
Alice Brown,5,Amazing product exactly as described,2024-01-15,Yes
Charlie Davis,2,Product broke after one week,2024-01-16,Yes
Diana Wilson,4,Good value for money,2024-01-17,No
Frank Miller,1,Completely useless waste of money,2024-01-18,Yes"""

    @pytest.fixture
    def sample_yelp_csv(self):
        """Sample Yelp review CSV data"""
        return """user_name,rating,text,date,business_id
Mike Taylor,5,Best pizza in town!,2024-01-15,biz_123
Sarah Connor,3,Average food nothing special,2024-01-16,biz_123
Tom Hardy,4,Great atmosphere and service,2024-01-17,biz_123
Lisa White,2,Too expensive for what you get,2024-01-18,biz_123"""

    @pytest.fixture
    def sample_generic_csv(self):
        """Sample generic review CSV data"""
        return """customer_name,score,feedback,timestamp,platform
John Customer,8,Really enjoyed the experience,2024-01-15 10:30:00,Website
Jane Buyer,6,Could be better,2024-01-16 14:20:00,Email
Bob User,10,Perfect! Highly recommend,2024-01-17 09:15:00,Survey"""

    @pytest.fixture
    def malformed_csv(self):
        """Sample malformed CSV data for error testing"""
        return """name,rating,comment
John Doe,invalid_rating,Good service
Jane Smith,,Empty rating
,3,Anonymous reviewer
"""

    def test_platform_detection_google(self, importer, sample_google_csv):
        """Test detection of Google My Business CSV format"""
        df = pd.read_csv(io.StringIO(sample_google_csv))
        platform = importer.detect_platform(df.columns.tolist())
        assert platform == 'google'

    def test_platform_detection_amazon(self, importer, sample_amazon_csv):
        """Test detection of Amazon review CSV format"""
        df = pd.read_csv(io.StringIO(sample_amazon_csv))
        platform = importer.detect_platform(df.columns.tolist())
        assert platform == 'amazon'

    def test_platform_detection_yelp(self, importer, sample_yelp_csv):
        """Test detection of Yelp review CSV format"""
        df = pd.read_csv(io.StringIO(sample_yelp_csv))
        platform = importer.detect_platform(df.columns.tolist())
        assert platform == 'yelp'

    def test_platform_detection_generic_fallback(self, importer):
        """Test fallback to generic platform for unknown formats"""
        columns = ['unknown_col1', 'mystery_col2', 'weird_col3']
        platform = importer.detect_platform(columns)
        assert platform == 'generic'

    def test_platform_detection_edge_cases(self, importer):
        """Test platform detection with edge cases"""
        # Empty columns
        assert importer.detect_platform([]) == 'generic'
        
        # Single column
        assert importer.detect_platform(['rating']) == 'generic'
        
        # Case sensitivity
        platform = importer.detect_platform(['STAR_RATING', 'REVIEW_BODY', 'VERIFIED_PURCHASE'])
        assert platform == 'amazon'

    def test_column_mapping_google(self, importer, sample_google_csv):
        """Test column mapping for Google My Business data"""
        df = pd.read_csv(io.StringIO(sample_google_csv))
        mapped_df = importer.map_columns(df, 'google')
        
        assert 'rating' in mapped_df.columns
        assert 'comment' in mapped_df.columns
        assert 'date' in mapped_df.columns
        assert 'reviewer_name' in mapped_df.columns
        assert 'source' in mapped_df.columns
        
        # Check data integrity
        assert mapped_df['rating'].iloc[0] == 5
        assert mapped_df['comment'].iloc[0] == "Great service and friendly staff!"
        assert mapped_df['reviewer_name'].iloc[0] == "John Doe"

    def test_column_mapping_amazon(self, importer, sample_amazon_csv):
        """Test column mapping for Amazon review data"""
        df = pd.read_csv(io.StringIO(sample_amazon_csv))
        mapped_df = importer.map_columns(df, 'amazon')
        
        assert 'rating' in mapped_df.columns
        assert 'comment' in mapped_df.columns
        assert 'date' in mapped_df.columns
        assert 'reviewer_name' in mapped_df.columns
        
        # Check data integrity
        assert mapped_df['rating'].iloc[0] == 5
        assert mapped_df['comment'].iloc[0] == "Amazing product exactly as described"
        assert mapped_df['reviewer_name'].iloc[0] == "Alice Brown"

    def test_column_mapping_missing_columns(self, importer):
        """Test column mapping when required columns are missing"""
        df = pd.DataFrame({
            'unknown_col1': [1, 2, 3],
            'unknown_col2': ['a', 'b', 'c']
        })
        
        mapped_df = importer.map_columns(df, 'google')
        
        # Should handle missing columns gracefully
        assert isinstance(mapped_df, pd.DataFrame)
        # Source should be set to platform name when column not found
        if 'source' in mapped_df.columns:
            assert mapped_df['source'].iloc[0] == 'Google'

    def test_rating_normalization(self, importer):
        """Test rating normalization to 1-5 scale"""
        # Test 10-point scale
        ratings_10 = pd.Series([2, 4, 6, 8, 10])
        normalized = importer._normalize_rating(ratings_10)
        expected = pd.Series([1, 2, 3, 4, 5])
        pd.testing.assert_series_equal(normalized, expected)
        
        # Test 100-point scale
        ratings_100 = pd.Series([20, 40, 60, 80, 100])
        normalized = importer._normalize_rating(ratings_100)
        expected = pd.Series([1, 2, 3, 4, 5])
        pd.testing.assert_series_equal(normalized, expected)
        
        # Test already normalized (1-5)
        ratings_5 = pd.Series([1, 2, 3, 4, 5])
        normalized = importer._normalize_rating(ratings_5)
        pd.testing.assert_series_equal(normalized, ratings_5)

    def test_rating_normalization_edge_cases(self, importer):
        """Test rating normalization with edge cases"""
        # Test with NaN values
        ratings_with_nan = pd.Series([1, None, 3, 4, 5])
        normalized = importer._normalize_rating(ratings_with_nan)
        assert pd.isna(normalized.iloc[1])
        assert normalized.iloc[0] == 1
        
        # Test with string values that can't be converted
        ratings_invalid = pd.Series(['invalid', 'bad', 'terrible'])
        normalized = importer._normalize_rating(ratings_invalid)
        assert normalized.isna().all()
        
        # Test with decimal values
        ratings_decimal = pd.Series([1.2, 2.7, 3.9, 4.1, 4.8])
        normalized = importer._normalize_rating(ratings_decimal)
        assert all(normalized.between(1, 5))

    def test_date_parsing(self, importer):
        """Test date parsing with various formats"""
        # Test ISO format
        dates_iso = pd.Series(['2024-01-15T10:30:00Z', '2024-01-16T14:20:00Z'])
        parsed = importer._parse_dates(dates_iso)
        assert not parsed.isna().any()
        
        # Test different date formats
        dates_various = pd.Series([
            '2024-01-15',
            '01/15/2024',
            '15/01/2024',
            '2024/01/15'
        ])
        parsed = importer._parse_dates(dates_various)
        # At least some should parse successfully
        assert parsed.notna().sum() > 0

    def test_date_parsing_invalid(self, importer):
        """Test date parsing with invalid dates"""
        invalid_dates = pd.Series(['not_a_date', '2024-13-45', ''])
        parsed = importer._parse_dates(invalid_dates)
        # Should handle gracefully without crashing
        assert isinstance(parsed, pd.Series)

    def test_validation_and_cleaning(self, importer):
        """Test data validation and cleaning"""
        # Create test dataframe with various issues
        test_data = pd.DataFrame({
            'rating': [5, None, 3, 'invalid', 6, 0],
            'comment': ['Good service', '', 'Great!', None, 'Excellent', 'Bad'],
            'reviewer_name': ['John', '', None, 'Jane', 'Bob', 'Alice'],
            'source': ['Google', '', None, 'Yelp', 'Facebook', '']
        })
        
        cleaned_df, stats = importer.validate_and_clean(test_data)
        
        # Check that invalid data was removed/cleaned
        assert len(cleaned_df) <= len(test_data)
        assert stats['original_count'] == len(test_data)
        assert stats['final_count'] == len(cleaned_df)
        assert 'success_rate' in stats
        
        # Check that remaining data is valid
        if not cleaned_df.empty:
            # Ratings should be within 1-5 range or NaN
            valid_ratings = cleaned_df['rating'].isna() | cleaned_df['rating'].between(1, 5)
            assert valid_ratings.all()
            
            # Anonymous should replace empty names
            if 'reviewer_name' in cleaned_df.columns:
                assert not cleaned_df['reviewer_name'].isin(['', None]).any()

    def test_validation_removes_empty_rows(self, importer):
        """Test that validation removes rows with no useful data"""
        test_data = pd.DataFrame({
            'rating': [None, None, 3],
            'comment': ['', None, 'Good service'],
            'reviewer_name': ['John', 'Jane', 'Bob']
        })
        
        cleaned_df, stats = importer.validate_and_clean(test_data)
        
        # Should only keep the row with actual content
        assert len(cleaned_df) == 1
        assert cleaned_df.iloc[0]['rating'] == 3
        assert cleaned_df.iloc[0]['comment'] == 'Good service'

    def test_preview_csv_valid(self, importer, sample_google_csv):
        """Test CSV preview functionality with valid data"""
        preview = importer.preview_csv(sample_google_csv)
        
        assert preview['valid'] is True
        assert preview['detected_platform'] == 'google'
        assert preview['total_rows'] == 4
        assert preview['valid_rows'] <= preview['total_rows']
        assert 'columns_found' in preview
        assert 'mapped_columns' in preview
        assert 'preview' in preview
        assert len(preview['preview']) <= 5  # Preview should be limited to 5 rows

    def test_preview_csv_invalid(self, importer):
        """Test CSV preview functionality with invalid data"""
        invalid_csv = "this,is,not,a,valid,csv\nwith,malformed,data"
        preview = importer.preview_csv(invalid_csv)
        
        # Should handle gracefully
        assert isinstance(preview, dict)
        assert 'valid' in preview

    def test_preview_csv_empty(self, importer):
        """Test CSV preview with empty file"""
        empty_csv = ""
        preview = importer.preview_csv(empty_csv)
        
        assert preview['valid'] is False
        assert 'error' in preview

    def test_get_supported_formats(self, importer):
        """Test getting supported formats information"""
        formats = importer.get_supported_formats()
        
        assert 'supported_platforms' in formats
        assert 'universal_format' in formats
        assert isinstance(formats['supported_platforms'], list)
        assert len(formats['supported_platforms']) > 0
        
        # Check that each platform has required fields
        for platform in formats['supported_platforms']:
            assert 'name' in platform
            assert 'required_columns' in platform
            assert 'optional_columns' in platform
            assert 'export_instructions' in platform

    def test_find_column_exact_match(self, importer):
        """Test column finding with exact matches"""
        columns_dict = {'rating': 'rating', 'comment': 'comment', 'date': 'date'}
        possible_names = ['rating', 'comment']
        
        found = importer._find_column(columns_dict, possible_names)
        assert found == 'rating'  # Should find first match

    def test_find_column_partial_match(self, importer):
        """Test column finding with partial matches"""
        columns_dict = {'star_rating': 'star_rating', 'review_text': 'review_text'}
        possible_names = ['rating', 'text']
        
        found = importer._find_column(columns_dict, possible_names)
        assert found in ['star_rating', 'review_text']

    def test_find_column_no_match(self, importer):
        """Test column finding when no match exists"""
        columns_dict = {'unknown1': 'unknown1', 'unknown2': 'unknown2'}
        possible_names = ['rating', 'comment']
        
        found = importer._find_column(columns_dict, possible_names)
        assert found is None

    def test_full_import_workflow_google(self, importer, sample_google_csv):
        """Test complete import workflow for Google data"""
        # Step 1: Preview
        preview = importer.preview_csv(sample_google_csv)
        assert preview['valid'] is True
        assert preview['detected_platform'] == 'google'
        
        # Step 2: Parse and map
        df = pd.read_csv(io.StringIO(sample_google_csv))
        platform = importer.detect_platform(df.columns.tolist())
        mapped_df = importer.map_columns(df, platform)
        
        # Step 3: Validate and clean
        final_df, stats = importer.validate_and_clean(mapped_df)
        
        assert not final_df.empty
        assert stats['success_rate'] > 0
        assert 'imported_at' in final_df.columns
        assert 'import_method' in final_df.columns

    def test_full_import_workflow_amazon(self, importer, sample_amazon_csv):
        """Test complete import workflow for Amazon data"""
        # Step 1: Preview
        preview = importer.preview_csv(sample_amazon_csv)
        assert preview['valid'] is True
        assert preview['detected_platform'] == 'amazon'
        
        # Step 2: Parse and map
        df = pd.read_csv(io.StringIO(sample_amazon_csv))
        platform = importer.detect_platform(df.columns.tolist())
        mapped_df = importer.map_columns(df, platform)
        
        # Step 3: Validate and clean
        final_df, stats = importer.validate_and_clean(mapped_df)
        
        assert not final_df.empty
        assert stats['success_rate'] > 0
        # Check Amazon-specific data preservation
        assert 'Alice Brown' in final_df['reviewer_name'].values

    def test_malformed_data_handling(self, importer, malformed_csv):
        """Test handling of malformed CSV data"""
        try:
            preview = importer.preview_csv(malformed_csv)
            
            # Should not crash and should provide meaningful feedback
            assert isinstance(preview, dict)
            
            if preview.get('valid', False):
                # If parsing succeeded, check that validation catches issues
                assert preview['valid_rows'] < preview['total_rows']
                assert len(preview.get('issues', [])) > 0
        except Exception as e:
            # If it does fail, it should be handled gracefully
            pytest.fail(f"Malformed data caused unhandled exception: {str(e)}")

    def test_large_dataset_handling(self, importer):
        """Test handling of larger datasets"""
        # Create a larger dataset
        large_data = []
        for i in range(1000):
            large_data.append(f"User{i},{i % 5 + 1},Review text {i},2024-01-{(i % 28) + 1:02d}")
        
        large_csv = "reviewer_name,star_rating,review_text,date\n" + "\n".join(large_data)
        
        preview = importer.preview_csv(large_csv)
        
        assert preview['valid'] is True
        assert preview['total_rows'] == 1000
        assert len(preview['preview']) <= 5  # Preview should still be limited

    def test_unicode_and_special_characters(self, importer):
        """Test handling of unicode and special characters"""
        unicode_csv = """reviewer_name,rating,comment
José García,5,"¡Excelente servicio! 👍"
李小明,4,很好的产品质量
Müller,3,"Güt, aber könnte besser sein"
O'Connor,2,"Won't recommend, it's \"okay\""
"""
        
        preview = importer.preview_csv(unicode_csv)
        
        # Should handle unicode characters without issues
        assert preview['valid'] is True
        assert preview['total_rows'] == 4

    def test_different_separators(self, importer):
        """Test handling of different CSV separators"""
        # Test semicolon separator
        semicolon_csv = "name;rating;comment\nJohn;5;Great service\nJane;4;Good product"
        
        # Test tab separator  
        tab_csv = "name\trating\tcomment\nJohn\t5\tGreat service\nJane\t4\tGood product"
        
        # Both should be handled gracefully
        preview_semi = importer.preview_csv(semicolon_csv)
        preview_tab = importer.preview_csv(tab_csv)
        
        # At minimum, should not crash
        assert isinstance(preview_semi, dict)
        assert isinstance(preview_tab, dict)

    @patch('app.services.universal_review_importer.logger')
    def test_logging_integration(self, mock_logger, importer, sample_google_csv):
        """Test that logging works correctly during import process"""
        preview = importer.preview_csv(sample_google_csv)
        
        # Verify that logging was called during platform detection
        assert mock_logger.info.called

    def test_global_instance_available(self):
        """Test that global universal_importer instance is available"""
        assert universal_importer is not None
        assert isinstance(universal_importer, UniversalReviewImporter)


class TestPlatformSpecificLogic:
    """Test platform-specific import logic and edge cases"""

    @pytest.fixture
    def importer(self):
        return UniversalReviewImporter()

    def test_amazon_verified_purchase_handling(self, importer):
        """Test Amazon-specific verified purchase column"""
        amazon_csv = """reviewer_name,star_rating,review_body,verified_purchase
John,5,Great product,Yes
Jane,3,Okay product,No
Bob,1,Bad product,Yes"""
        
        df = pd.read_csv(io.StringIO(amazon_csv))
        platform = importer.detect_platform(df.columns.tolist())
        assert platform == 'amazon'
        
        mapped_df = importer.map_columns(df, platform)
        # Should successfully map basic columns
        assert 'rating' in mapped_df.columns
        assert 'comment' in mapped_df.columns

    def test_facebook_recommendation_type(self, importer):
        """Test Facebook-specific recommendation type handling"""
        facebook_csv = """from_name,recommendation_type,message,created_time
John Doe,positive,Great place!,2024-01-15T10:30:00
Jane Smith,negative,Not good,2024-01-16T14:20:00"""
        
        df = pd.read_csv(io.StringIO(facebook_csv))
        platform = importer.detect_platform(df.columns.tolist())
        assert platform == 'facebook'

    def test_yelp_sentiment_columns(self, importer):
        """Test Yelp-specific sentiment columns (cool, funny, useful)"""
        yelp_csv = """user_name,rating,text,cool,funny,useful,business_id
Mike,5,Great food!,2,1,5,biz_123
Sarah,3,Average,0,0,1,biz_123"""
        
        df = pd.read_csv(io.StringIO(yelp_csv))
        platform = importer.detect_platform(df.columns.tolist())
        assert platform == 'yelp'

    def test_tripadvisor_travel_type(self, importer):
        """Test TripAdvisor-specific travel type and visit date"""
        tripadvisor_csv = """reviewer_name,rating,review_text,visit_date,trip_type
John,5,Amazing hotel!,2024-01-01,Business
Jane,4,Good location,2024-01-02,Leisure"""
        
        df = pd.read_csv(io.StringIO(tripadvisor_csv))
        platform = importer.detect_platform(df.columns.tolist())
        assert platform == 'tripadvisor'

    def test_platform_detection_with_overlapping_columns(self, importer):
        """Test platform detection when columns overlap between platforms"""
        # CSV that could be multiple platforms
        ambiguous_csv = """name,rating,text,date
John,5,Great service,2024-01-15
Jane,4,Good product,2024-01-16"""
        
        df = pd.read_csv(io.StringIO(ambiguous_csv))
        platform = importer.detect_platform(df.columns.tolist())
        
        # Should default to generic when confidence is low
        assert platform in ['generic', 'yelp']  # Could be either

    def test_platform_confidence_scoring(self, importer):
        """Test that platform detection uses confidence scoring correctly"""
        # High-confidence Amazon columns
        high_confidence_amazon = ['review_body', 'verified_purchase', 'star_rating', 'asin']
        platform = importer.detect_platform(high_confidence_amazon)
        assert platform == 'amazon'
        
        # High-confidence Google columns  
        high_confidence_google = ['reviewer_display_name', 'review_reply', 'location_id']
        platform = importer.detect_platform(high_confidence_google)
        assert platform == 'google'

    def test_mixed_platform_data(self, importer):
        """Test handling of data that might come from multiple platforms"""
        mixed_csv = """source,rating,comment,date,reviewer_name
Google,5,Great service,2024-01-15,John
Amazon,4,Good product,2024-01-16,Jane
Yelp,3,Average food,2024-01-17,Bob"""
        
        df = pd.read_csv(io.StringIO(mixed_csv))
        platform = importer.detect_platform(df.columns.tolist())
        
        # Should handle gracefully
        mapped_df = importer.map_columns(df, platform)
        cleaned_df, stats = importer.validate_and_clean(mapped_df)
        
        assert not cleaned_df.empty
        assert stats['success_rate'] > 0


class TestErrorHandlingAndEdgeCases:
    """Test comprehensive error handling and edge cases"""

    @pytest.fixture
    def importer(self):
        return UniversalReviewImporter()

    def test_completely_empty_csv(self, importer):
        """Test handling of completely empty CSV"""
        empty_csv = ""
        result = importer.preview_csv(empty_csv)
        
        assert result['valid'] is False
        assert 'error' in result or 'suggestions' in result

    def test_csv_with_only_headers(self, importer):
        """Test CSV with headers but no data"""
        headers_only = "rating,comment,date"
        result = importer.preview_csv(headers_only)
        
        assert result['valid'] is False

    def test_csv_with_all_null_data(self, importer):
        """Test CSV where all data cells are null/empty"""
        all_null = """rating,comment,date
,,
,,
,,"""
        result = importer.preview_csv(all_null)
        
        # Should be invalid or have zero valid rows
        assert result['valid'] is False or result['valid_rows'] == 0

    def test_extremely_long_text_fields(self, importer):
        """Test handling of extremely long text in review comments"""
        long_text = "A" * 10000  # Very long review text
        csv_with_long_text = f"""rating,comment
5,{long_text}
4,Normal review"""
        
        result = importer.preview_csv(csv_with_long_text)
        
        # Should handle without crashing
        assert isinstance(result, dict)

    def test_numeric_overflow_ratings(self, importer):
        """Test handling of extremely large numeric ratings"""
        large_numbers = """rating,comment
999999999,Good service
-999999999,Bad service
0.00000001,Tiny rating"""
        
        result = importer.preview_csv(large_numbers)
        
        # Should handle gracefully
        assert isinstance(result, dict)

    def test_sql_injection_attempt(self, importer):
        """Test that CSV parsing is safe from SQL injection attempts"""
        malicious_csv = """rating,comment
5,"'; DROP TABLE users; --"
4,"<script>alert('xss')</script>"
3,"UNION SELECT * FROM passwords"""
        
        result = importer.preview_csv(malicious_csv)
        
        # Should process as normal text without security issues
        assert isinstance(result, dict)
        if result.get('valid'):
            assert result['total_rows'] == 3

    def test_date_parsing_with_invalid_formats(self, importer):
        """Test date parsing with completely invalid date formats"""
        invalid_dates = pd.Series([
            'tomorrow',
            'next week', 
            'sometime in 2024',
            '32/13/2024',  # Invalid day/month
            '2024-99-99'   # Invalid month/day
        ])
        
        parsed = importer._parse_dates(invalid_dates)
        
        # Should handle gracefully - most/all should be NaT (Not a Time)
        assert isinstance(parsed, pd.Series)
        # Most should fail to parse
        assert parsed.isna().sum() >= 3

    @patch('app.services.universal_review_importer.pd.read_csv')
    def test_pandas_exception_handling(self, mock_read_csv, importer):
        """Test handling when pandas raises unexpected exceptions"""
        mock_read_csv.side_effect = Exception("Unexpected pandas error")
        
        result = importer.preview_csv("rating,comment\n5,Good")
        
        assert result['valid'] is False
        assert 'error' in result


if __name__ == "__main__":
    # Allow running tests directly
    pytest.main([__file__, "-v"])
