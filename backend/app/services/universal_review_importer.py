# Universal Review CSV Importer
# Designed to accept review exports from ANY platform
# Instructions updated for user-friendliness and accuracy

import pandas as pd
import io
import csv
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import logging
import re

logger = logging.getLogger(__name__)

class UniversalReviewImporter:
    """
    Handles CSV uploads from any review platform with intelligent column mapping
    """

    # Universal column mappings for different platforms
    COLUMN_MAPPINGS = {
        # Google My Business exports
        'google': {
            'rating': ['star_rating', 'rating', 'stars', 'review_rating'],
            'comment': ['review_text', 'comment', 'review_comment', 'text', 'review'],
            'date': ['review_date', 'date', 'created_date', 'timestamp', 'create_time'],
            'reviewer': ['reviewer_name', 'customer_name', 'name', 'reviewer', 'reviewer_display_name'],
            'source': ['source', 'platform']
        },

        # Yelp exports
        'yelp': {
            'rating': ['rating', 'stars', 'star_rating'],
            'comment': ['text', 'review_text', 'comment'],
            'date': ['date', 'review_date', 'created_date'],
            'reviewer': ['user_name', 'reviewer_name', 'name'],
            'source': ['source']
        },

        # Facebook exports
        'facebook': {
            'rating': ['rating', 'recommendation_type', 'stars'],
            'comment': ['review_text', 'comment', 'message'],
            'date': ['created_time', 'date'],
            'reviewer': ['reviewer_name', 'from_name', 'name'],
            'source': ['source']
        },

        # Amazon/eCommerce exports
        'amazon': {
            'rating': ['star_rating', 'rating', 'stars'],
            'comment': ['review_body', 'review_text', 'comment'],
            'date': ['review_date', 'date'],
            'reviewer': ['reviewer_name', 'customer_name'],
            'source': ['marketplace', 'source']
        },

        # TripAdvisor exports
        'tripadvisor': {
            'rating': ['rating', 'stars', 'star_rating'],
            'comment': ['review_text', 'text', 'comment'],
            'date': ['date', 'review_date', 'visit_date'],
            'reviewer': ['reviewer_name', 'username', 'name'],
            'source': ['source']
        },

        # Generic/Other platforms
        'generic': {
            'rating': ['rating', 'stars', 'star_rating', 'score'],
            'comment': ['comment', 'review', 'text', 'feedback', 'review_text', 'feedback_text'],
            'date': ['date', 'created_date', 'review_date', 'timestamp'],
            'reviewer': ['name', 'customer_name', 'reviewer_name', 'user_name'],
            'source': ['source', 'platform', 'origin']
        }
    }

    def detect_platform(self, columns: List[str]) -> str:
        """
        Intelligently detect which platform this CSV export came from using
        weighted scoring system to handle overlapping column names
        """
        columns_lower = [col.lower().strip() for col in columns]
        
        # Platform indicators with confidence weights
        platform_indicators = {
            'amazon': {
                # Unique Amazon identifiers (high confidence)
                'review_body': 10,
                'vine_customer_review': 10,
                'verified_purchase': 10,
                'marketplace': 10,
                'product_id': 9,
                'product_title': 8,
                'product_category': 8,
                'helpful_votes': 8,
                'total_votes': 8,
                'asin': 9,
                
                # Common Amazon terms (medium confidence)
                'star_rating': 5,  # Higher weight for Amazon than Google
                'reviewer_name': 3,
                'review_date': 3,
            },
            
            'google': {
                # Unique Google identifiers (high confidence)
                'reviewer_display_name': 10,
                'review_id': 10,
                'review_reply': 8,
                'reviewer_profile_photo': 8,
                'business_reply': 8,
                'location_id': 9,
                
                # Common Google terms (medium confidence)
                'star_rating': 3,  # Lower weight since shared with Amazon
                'review_comment': 5,
                'review_text': 3,
                'create_time': 4,
            },
            
            'yelp': {
                # Unique Yelp identifiers (high confidence)
                'business_id': 10,
                'review_id': 9,
                'user_id': 8,
                'elite_year': 10,
                'cool': 8,
                'funny': 8,
                'useful': 8,
                
                # Yelp-specific patterns (lower weights for common terms)
                'rating': 3,
                'text': 3,
                'date': 2,
            },
            
            'facebook': {
                # Unique Facebook identifiers (high confidence)
                'recommendation_type': 10,
                'created_time': 9,
                'from_name': 8,
                'from_id': 8,
                'page_id': 8,
                'post_id': 7,
                
                # Facebook patterns
                'message': 5,
                'rating': 4,
            },
            
            'tripadvisor': {
                # Unique TripAdvisor identifiers (high confidence)
                'visit_date': 10,
                'trip_type': 9,
                'traveler_type': 8,
                'hotel_id': 8,
                'location_id': 8,
                
                # TripAdvisor patterns
                'rating': 5,
                'review_text': 4,
                'title': 4,
            }
        }
        
        # Calculate confidence scores for each platform
        platform_scores = {}
        
        for platform, indicators in platform_indicators.items():
            score = 0
            matches = []
            
            for indicator, weight in indicators.items():
                # Exact match
                if indicator in columns_lower:
                    score += weight
                    matches.append(f"{indicator} (exact)")
                # Partial match (substring)
                elif any(indicator in col for col in columns_lower):
                    score += weight * 0.7  # Reduced weight for partial matches
                    matches.append(f"{indicator} (partial)")
                # Check if column contains the indicator
                elif any(col in indicator for col in columns_lower if len(col) > 3):
                    score += weight * 0.5  # Further reduced for reverse matches
                    matches.append(f"{indicator} (contains)")
            
            platform_scores[platform] = {
                'score': score,
                'matches': matches
            }
        
        # Find the platform with highest score
        if not platform_scores:
            return 'generic'
        
        best_platform = max(platform_scores.keys(), key=lambda p: platform_scores[p]['score'])
        best_score = platform_scores[best_platform]['score']
        
        # Log detection results for debugging
        logger.info(f"Platform detection for columns {columns}:")
        for platform, data in platform_scores.items():
            logger.info(f"  {platform}: {data['score']} points - {data['matches']}")
        logger.info(f"Selected: {best_platform} (score: {best_score})")
        
        # Require minimum confidence threshold
        if best_score < 3:
            logger.info("No platform reached minimum confidence threshold, defaulting to generic")
            return 'generic'
        
        return best_platform

    def map_columns(self, df: pd.DataFrame, platform: str) -> pd.DataFrame:
        """
        Map platform-specific columns to universal review format
        """
        columns_lower = {col: col.lower().strip() for col in df.columns}
        mappings = self.COLUMN_MAPPINGS[platform]

        mapped_data = {}

        # Map rating
        rating_col = self._find_column(columns_lower, mappings['rating'])
        if rating_col:
            mapped_data['rating'] = df[rating_col]
            # Normalize ratings to 1-5 scale if needed
            mapped_data['rating'] = self._normalize_rating(mapped_data['rating'])

        # Map comment/review text
        comment_col = self._find_column(columns_lower, mappings['comment'])
        if comment_col:
            mapped_data['comment'] = df[comment_col]

        # Map date
        date_col = self._find_column(columns_lower, mappings['date'])
        if date_col:
            mapped_data['date'] = self._parse_dates(df[date_col])

        # Map reviewer name
        reviewer_col = self._find_column(columns_lower, mappings['reviewer'])
        if reviewer_col:
            mapped_data['reviewer_name'] = df[reviewer_col]

        # Map or set source
        source_col = self._find_column(columns_lower, mappings['source'])
        if source_col:
            mapped_data['source'] = df[source_col]
        else:
            mapped_data['source'] = platform.title()

        return pd.DataFrame(mapped_data)

    def _find_column(self, columns_dict: Dict[str, str], possible_names: List[str]) -> Optional[str]:
        """Find matching column name from possible variations"""
        for possible_name in possible_names:
            for original_col, lower_col in columns_dict.items():
                if possible_name == lower_col or possible_name in lower_col or lower_col in possible_name:
                    return original_col
        return None

    def _normalize_rating(self, ratings: pd.Series) -> pd.Series:
        """Normalize ratings to 1-5 scale"""
        # Handle different rating scales
        ratings_numeric = pd.to_numeric(ratings, errors='coerce')
        max_rating = ratings_numeric.max()
        min_rating = ratings_numeric.min()

        if pd.isna(max_rating):
            return ratings_numeric  # All NaN values

        # If already in 1-5 range
        if max_rating <= 5 and min_rating >= 1:
            return ratings_numeric.round()
        elif max_rating <= 10:
            # Convert 10-point to 5-point scale
            return ((ratings_numeric / 2).round()).clip(1, 5)
        elif max_rating <= 100:
            # Convert 100-point to 5-point scale
            return ((ratings_numeric / 20).round()).clip(1, 5)
        else:
            # Keep as-is if unclear, but clip to reasonable range
            return ratings_numeric.clip(1, 5)

    def _parse_dates(self, dates: pd.Series) -> pd.Series:
        """Parse various date formats"""
        try:
            # Try standard pandas date parsing first
            parsed_dates = pd.to_datetime(dates, errors='coerce')

            # If many dates failed to parse, try alternative formats
            failed_count = parsed_dates.isna().sum()
            if failed_count > len(dates) * 0.5:  # More than 50% failed
                # Try specific formats
                formats_to_try = [
                    '%Y-%m-%d %H:%M:%S',
                    '%Y-%m-%d',
                    '%m/%d/%Y',
                    '%d/%m/%Y',
                    '%Y/%m/%d',
                    '%m-%d-%Y',
                    '%d-%m-%Y',
                ]

                for fmt in formats_to_try:
                    try:
                        alt_parsed = pd.to_datetime(dates, format=fmt, errors='coerce')
                        alt_failed = alt_parsed.isna().sum()
                        if alt_failed < failed_count:
                            parsed_dates = alt_parsed
                            failed_count = alt_failed
                    except:
                        continue

            return parsed_dates
        except Exception as e:
            logger.warning(f"Date parsing failed: {str(e)}")
            return pd.to_datetime(dates, errors='coerce')

    def validate_and_clean(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict]:
        """
        Validate and clean the mapped review data
        """
        original_count = len(df)
        validation_stats = {
            'original_count': original_count,
            'issues': []
        }

        # Remove rows with no comment and no rating
        before_count = len(df)
        df = df.dropna(subset=['comment', 'rating'], how='all')
        if len(df) < before_count:
            validation_stats['issues'].append(f"Removed {before_count - len(df)} rows with no comment or rating")

        # Clean comment text
        if 'comment' in df.columns:
            df['comment'] = df['comment'].fillna('')
            df['comment'] = df['comment'].astype(str).str.strip()
            # Remove empty comments if no rating exists
            before_count = len(df)
            df = df[~((df['comment'] == '') & (pd.isna(df.get('rating'))))]
            if len(df) < before_count:
                validation_stats['issues'].append(f"Removed {before_count - len(df)} rows with empty comments and no rating")

        # Validate ratings
        if 'rating' in df.columns:
            before_count = len(df)
            df['rating'] = pd.to_numeric(df['rating'], errors='coerce')
            df = df[df['rating'].isna() | df['rating'].between(1, 5)]
            if len(df) < before_count:
                validation_stats['issues'].append(f"Removed {before_count - len(df)} rows with invalid ratings")

        # Clean reviewer names
        if 'reviewer_name' in df.columns:
            df['reviewer_name'] = df['reviewer_name'].fillna('Anonymous')
            df['reviewer_name'] = df['reviewer_name'].astype(str).str.strip()
            # Replace empty strings with Anonymous
            df.loc[df['reviewer_name'] == '', 'reviewer_name'] = 'Anonymous'

        # Clean source names
        if 'source' in df.columns:
            df['source'] = df['source'].fillna('Unknown')
            df['source'] = df['source'].astype(str).str.strip()
            df.loc[df['source'] == '', 'source'] = 'Unknown'

        # Add metadata
        df['imported_at'] = datetime.now()
        df['import_method'] = 'universal_csv'

        validation_stats['final_count'] = len(df)
        validation_stats['success_rate'] = len(df) / original_count if original_count > 0 else 0

        return df, validation_stats

    def get_supported_formats(self) -> Dict:
        """
        Return information about supported CSV formats and column mappings
        with user-friendly, accurate instructions.
        """
        # Generic instruction applicable to most platforms
        generic_instruction = (
            "Direct CSV export is often not available on the platform itself. "
            "You will likely need to use a third-party data export service, a web scraping tool, "
            "or an analytics platform to get your reviews into a CSV file. Our importer is designed "
            "to be flexible and read files from most common tools."
        )
        
        return {
            "supported_platforms": [
                {
                    "name": "Google Business Profile",
                    "required_columns": ["rating", "comment"],
                    "optional_columns": ["date", "reviewer_name"],
                    "export_instructions": generic_instruction
                },
                {
                    "name": "Yelp",
                    "required_columns": ["rating", "text"],
                    "optional_columns": ["date", "user_name"],
                    "export_instructions": generic_instruction
                },
                {
                    "name": "Facebook",
                    "required_columns": ["rating OR recommendation", "comment"],
                    "optional_columns": ["date", "reviewer_name"],
                    "export_instructions": (
                        f"{generic_instruction} "
                        "Hint: Look for export options within advanced marketing or analytics "
                        "tools that you have connected to your Facebook Business Page."
                    )
                },
                {
                    "name": "Amazon",
                    "required_columns": ["star_rating", "review_body"],
                    "optional_columns": ["review_date", "reviewer_name"],
                    "export_instructions": (
                        "Important Note: For Seller Feedback, you can download 'Feedback Reports' "
                        "directly from your Amazon Seller Central account. For individual Product Reviews, "
                        "you will need to use a third-party product review export tool as direct downloads are not provided by Amazon."
                    )
                },
                {
                    "name": "TripAdvisor",
                    "required_columns": ["rating", "review_text"],
                    "optional_columns": ["visit_date", "reviewer_name"],
                    "export_instructions": generic_instruction
                },
                {
                    "name": "Generic/Other",
                    "required_columns": ["rating OR comment"],
                    "optional_columns": ["date", "reviewer_name", "source"],
                    "export_instructions": "Upload any CSV file containing review data, often obtained from third-party export tools or internal databases."
                }
            ],
            "universal_format": {
                "rating": "1-5 numeric scale",
                "comment": "Review text content",
                "date": "ISO date format (YYYY-MM-DD) or other common formats",
                "reviewer_name": "Customer/reviewer name",
                "source": "Platform or source identifier"
            }
        }

    def preview_csv(self, file_content: str) -> Dict:
        """
        Preview CSV format without importing (validation functionality)
        """
        try:
            # Sniff for separator
            try:
                sniffer = csv.Sniffer()
                dialect = sniffer.sniff(file_content.splitlines()[0])
                separator = dialect.delimiter
            except:
                separator = ',' # Default to comma

            df = pd.read_csv(io.StringIO(file_content), sep=separator)

            if df.empty:
                return {
                    "valid": False,
                    "error": "CSV file is empty",
                    "suggestions": ["Ensure the CSV file contains data"]
                }

            platform = self.detect_platform(df.columns.tolist())
            mapped_df = self.map_columns(df, platform)
            clean_df, validation_stats = self.validate_and_clean(mapped_df)

            return {
                "valid": len(clean_df) > 0,
                "detected_platform": platform,
                "total_rows": len(df),
                "valid_rows": len(clean_df),
                "invalid_rows": len(df) - len(clean_df),
                "columns_found": df.columns.tolist(),
                "mapped_columns": list(mapped_df.columns),
                "validation_stats": validation_stats,
                "preview": clean_df.head(5).to_dict('records') if not clean_df.empty else [],
                "issues": validation_stats.get('issues', [])
            }

        except Exception as e:
            return {
                "valid": False,
                "error": str(e),
                "suggestions": [
                    "Ensure file is a valid CSV",
                    "Check that required columns exist",
                    "Verify data format matches expected types",
                    "Make sure text with commas is properly quoted"
                ]
            }

# Global instance
universal_importer = UniversalReviewImporter()