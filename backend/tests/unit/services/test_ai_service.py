import pytest
import json
import httpx
import logging
from unittest.mock import AsyncMock, Mock, patch, MagicMock
from typing import Dict, Any
import os

# Set test environment before importing app modules
os.environ["AI_SERVICE_TYPE"] = "local"
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["SECRET_KEY"] = "test_secret_key_for_testing_only"
os.environ["AI_API_KEY"] = "test_api_key"

from app.services.ai_service import (
    analyze_feedback,
    analyze_with_claude,
    analyze_with_openai,
    analyze_local,
    _extract_json_from_text,
    _validate_ai_result,
    _adjust_sentiment_with_rating
)

class TestAnalyzeFeedback:
    """Test the main analyze_feedback function"""

    @pytest.mark.asyncio
    async def test_analyze_feedback_empty_text(self):
        """Test analyze_feedback with empty text"""
        result = await analyze_feedback("")
        
        assert result["sentiment"] == "neutral"
        assert result["topics"] == []
        assert "error" in result
        assert result["error"] == "Empty input text"

    @pytest.mark.asyncio
    async def test_analyze_feedback_whitespace_only(self):
        """Test analyze_feedback with whitespace-only text"""
        result = await analyze_feedback("   \n\t  ")
        
        assert result["sentiment"] == "neutral"
        assert result["topics"] == []
        assert "error" in result

    @pytest.mark.asyncio
    @patch('app.services.ai_service.settings.AI_SERVICE_TYPE', 'local')
    async def test_analyze_feedback_local_service(self):
        """Test analyze_feedback with local service"""
        text = "Great product, excellent quality!"
        result = await analyze_feedback(text)
        
        assert result["sentiment"] == "positive"
        assert isinstance(result["topics"], list)
        assert "method" in result

    @pytest.mark.asyncio
    @patch('app.services.ai_service.settings.AI_SERVICE_TYPE', 'claude')
    @patch('app.services.ai_service.analyze_with_claude')
    async def test_analyze_feedback_claude_success(self, mock_claude):
        """Test analyze_feedback with successful Claude API call"""
        mock_claude.return_value = {
            "sentiment": "positive",
            "topics": ["product quality", "customer service"]
        }
        
        text = "Great service and excellent product!"
        result = await analyze_feedback(text)
        
        assert result["sentiment"] == "positive"
        assert result["topics"] == ["product quality", "customer service"]
        mock_claude.assert_called_once_with(text, None)

    @pytest.mark.asyncio
    @patch('app.services.ai_service.settings.AI_SERVICE_TYPE', 'claude')
    @patch('app.services.ai_service.analyze_with_claude')
    @patch('app.services.ai_service.analyze_local')
    async def test_analyze_feedback_claude_failure_fallback(self, mock_local, mock_claude):
        """Test analyze_feedback falling back to local when Claude fails"""
        mock_claude.side_effect = Exception("API Error")
        mock_local.return_value = {
            "sentiment": "positive",
            "topics": ["product quality"],
            "method": "local_fallback"
        }
        
        text = "Great product!"
        result = await analyze_feedback(text)
        
        assert result["sentiment"] == "positive"
        assert result["topics"] == ["product quality"]
        assert "ai_error" in result
        assert result["fallback_used"] is True
        mock_claude.assert_called_once()
        mock_local.assert_called_once()

    @pytest.mark.asyncio
    @patch('app.services.ai_service.settings.AI_SERVICE_TYPE', 'openai')
    @patch('app.services.ai_service.analyze_with_openai')
    async def test_analyze_feedback_openai_success(self, mock_openai):
        """Test analyze_feedback with successful OpenAI API call"""
        mock_openai.return_value = {
            "sentiment": "negative",
            "topics": ["shipping speed", "customer service"]
        }
        
        text = "Slow shipping and poor service"
        result = await analyze_feedback(text)
        
        assert result["sentiment"] == "negative"
        assert result["topics"] == ["shipping speed", "customer service"]
        mock_openai.assert_called_once_with(text, None)

    @pytest.mark.asyncio
    @patch('app.services.ai_service.settings.AI_SERVICE_TYPE', 'claude')
    @patch('app.services.ai_service.analyze_with_claude')
    async def test_analyze_feedback_invalid_result_fallback(self, mock_claude):
        """Test analyze_feedback with invalid AI result"""
        mock_claude.return_value = None  # Invalid result
        
        text = "Great product!"
        result = await analyze_feedback(text)
        
        # Should fall back to local analysis
        assert result["sentiment"] in ["positive", "negative", "neutral"]
        assert isinstance(result["topics"], list)

    @pytest.mark.asyncio
    @patch('app.services.ai_service.settings.AI_SERVICE_TYPE', 'claude')
    @patch('app.services.ai_service.analyze_with_claude')
    async def test_analyze_feedback_missing_fields(self, mock_claude):
        """Test analyze_feedback with missing required fields"""
        mock_claude.return_value = {"some_field": "value"}  # Missing sentiment and topics
        
        text = "Great product!"
        result = await analyze_feedback(text)
        
        assert result["sentiment"] == "neutral"  # Default
        assert result["topics"] == []  # Default


class TestAnalyzeWithClaude:
    """Test the Claude API integration"""

    @pytest.mark.asyncio
    @patch('app.services.ai_service.settings.AI_API_KEY', '')
    async def test_analyze_with_claude_no_api_key(self):
        """Test Claude analysis with no API key"""
        with pytest.raises(ValueError, match="Claude API key not configured"):
            await analyze_with_claude("test text")

    @pytest.mark.asyncio
    @patch('app.services.ai_service.settings.AI_API_KEY', 'test_key')
    async def test_analyze_with_claude_empty_text(self):
        """Test Claude analysis with empty text"""
        with pytest.raises(ValueError, match="Empty text provided for analysis"):
            await analyze_with_claude("")

    @pytest.mark.asyncio
    @patch('app.services.ai_service.settings.AI_API_KEY', 'test_key')
    @patch('httpx.AsyncClient')
    async def test_analyze_with_claude_success(self, mock_client):
        """Test successful Claude API call"""
        # Mock response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "content": [
                {
                    "text": '{"sentiment": "positive", "topics": ["quality", "service"]}'
                }
            ]
        }
        
        mock_client_instance = AsyncMock()
        mock_client_instance.post.return_value = mock_response
        mock_client.return_value.__aenter__.return_value = mock_client_instance
        
        result = await analyze_with_claude("Great product and service!")
        
        assert result["sentiment"] == "positive"
        # Check that both expected topics are present, regardless of order
        assert set(result["topics"]) == {"Product Quality", "Customer Service"}
        mock_client_instance.post.assert_called_once()

    @pytest.mark.asyncio
    @patch('app.services.ai_service.settings.AI_API_KEY', 'test_key')
    @patch('httpx.AsyncClient')
    async def test_analyze_with_claude_auth_error(self, mock_client):
        """Test Claude API authentication error"""
        mock_response = Mock()
        mock_response.status_code = 401
        mock_response.request = Mock()
        
        mock_client_instance = AsyncMock()
        mock_client_instance.post.return_value = mock_response
        mock_client.return_value.__aenter__.return_value = mock_client_instance
        
        with pytest.raises(httpx.HTTPStatusError):
            await analyze_with_claude("test text")

    @pytest.mark.asyncio
    @patch('app.services.ai_service.settings.AI_API_KEY', 'test_key')
    @patch('httpx.AsyncClient')
    async def test_analyze_with_claude_timeout(self, mock_client):
        """Test Claude API timeout"""
        mock_client_instance = AsyncMock()
        mock_client_instance.post.side_effect = httpx.TimeoutException("Timeout")
        mock_client.return_value.__aenter__.return_value = mock_client_instance
        
        with pytest.raises(ConnectionError, match="Claude API timeout"):
            await analyze_with_claude("test text")


class TestAnalyzeWithOpenAI:
    """Test the OpenAI API integration"""

    @pytest.mark.asyncio
    async def test_analyze_with_openai_no_api_key(self):
        """Test OpenAI analysis with no API key"""
        # Test when AI_API_KEY is empty
        with patch('app.services.ai_service.settings.AI_API_KEY', ''):
            with pytest.raises(ValueError, match="OpenAI API key not configured"):
                await analyze_with_openai("test text")

    @pytest.mark.asyncio
    @patch('app.services.ai_service.settings.AI_API_KEY', 'test_key')
    async def test_analyze_with_openai_empty_text(self):
        """Test OpenAI analysis with empty text"""
        with pytest.raises(ValueError, match="Empty text provided for analysis"):
            await analyze_with_openai("")

    @pytest.mark.asyncio
    @patch('app.services.ai_service.settings.AI_API_KEY', 'test_key')
    @patch('httpx.AsyncClient')
    async def test_analyze_with_openai_success(self, mock_client):
        """Test successful OpenAI API call"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [
                {
                    "message": {
                        "content": '{"sentiment": "negative", "topics": ["shipping", "customer service"]}'
                    }
                }
            ]
        }
        
        mock_client_instance = AsyncMock()
        mock_client_instance.post.return_value = mock_response
        mock_client.return_value.__aenter__.return_value = mock_client_instance
        
        result = await analyze_with_openai("Poor shipping and bad service")
        
        assert result["sentiment"] == "negative"
        # Check that both expected topics are present, regardless of order
        assert set(result["topics"]) == {"Shipping & Delivery", "Customer Service"}


class TestAnalyzeLocal:
    """Test the local analysis function"""

    def test_analyze_local_empty_text(self):
        """Test local analysis with empty text"""
        result = analyze_local("")
        
        assert result["sentiment"] == "neutral"
        assert result["topics"] == []
        assert result["method"] == "local_fallback"

    def test_analyze_local_positive_sentiment(self):
        """Test local analysis with positive text"""
        text = "This product is excellent and I love it"
        result = analyze_local(text)
        
        assert result["sentiment"] == "positive"
        assert isinstance(result["topics"], list)

    def test_analyze_local_negative_sentiment(self):
        """Test local analysis with negative text"""
        text = "This product is terrible and I hate it"
        result = analyze_local(text)
        
        assert result["sentiment"] == "negative"
        assert isinstance(result["topics"], list)

    def test_analyze_local_neutral_sentiment(self):
        """Test local analysis with neutral text"""
        text = "This is a product that exists"
        result = analyze_local(text)
        
        assert result["sentiment"] == "neutral"
        assert isinstance(result["topics"], list)

    def test_analyze_local_topic_extraction(self):
        """Test local topic extraction"""
        text = "The shipping was fast but the product quality was poor"
        result = analyze_local(text)
        
        topics = result["topics"]
        # Check that both expected topics are present, regardless of order
        assert "Shipping & Delivery" in topics
        assert "Product Quality" in topics

    def test_analyze_local_with_rating_positive(self):
        """Test local analysis with positive rating"""
        text = "Okay product"  # Neutral text
        result = analyze_local(text, rating=5)
        
        assert result["sentiment"] == "positive"

    def test_analyze_local_with_rating_negative(self):
        """Test local analysis with negative rating"""
        text = "Okay product"  # Neutral text
        result = analyze_local(text, rating=1)
        
        assert result["sentiment"] == "negative"

    def test_analyze_local_with_rating_neutral(self):
        """Test local analysis with neutral rating"""
        text = "Okay product"  # Neutral text
        result = analyze_local(text, rating=3)
        
        assert result["sentiment"] == "neutral"


class TestExtractJsonFromText:
    """Test the JSON extraction helper function"""

    def test_extract_json_valid_json(self):
        """Test extracting valid JSON"""
        text = '{"sentiment": "positive", "topics": ["quality"]}'
        result = _extract_json_from_text(text)
        
        assert result["sentiment"] == "positive"
        assert result["topics"] == ["quality"]

    def test_extract_json_with_markdown(self):
        """Test extracting JSON from markdown code block"""
        text = '''Here's the analysis:
        ```json
        {"sentiment": "negative", "topics": ["shipping"]}
        ```
        '''
        result = _extract_json_from_text(text)
        
        assert result["sentiment"] == "negative"
        assert result["topics"] == ["shipping"]

    def test_extract_json_regex_fallback(self):
        """Test regex fallback when JSON parsing fails"""
        text = 'sentiment: "positive", topics: ["quality", "service"]'
        result = _extract_json_from_text(text)
        
        assert result["sentiment"] == "positive"
        assert "quality" in result["topics"]
        assert "service" in result["topics"]

    def test_extract_json_invalid_format(self):
        """Test extracting from completely invalid format"""
        text = "This is not JSON at all"
        result = _extract_json_from_text(text)
        
        # Should return default values
        assert result["sentiment"] == "neutral"
        assert result["topics"] == []


class TestValidateAiResult:
    """Test the AI result validation function"""

    def test_validate_ai_result_valid(self):
        """Test validating a valid AI result"""
        result = {
            "sentiment": "positive",
            "topics": ["quality", "service"]
        }
        validated = _validate_ai_result(result)
        
        assert validated["sentiment"] == "positive"
        # Check that both expected topics are present, regardless of order
        assert set(validated["topics"]) == {"Product Quality", "Customer Service"}

    def test_validate_ai_result_invalid_type(self):
        """Test validating invalid result type"""
        with pytest.raises(ValueError, match="Invalid AI result format"):
            _validate_ai_result("not a dict")

    def test_validate_ai_result_invalid_sentiment(self):
        """Test validating invalid sentiment"""
        result = {
            "sentiment": "very_happy",
            "topics": ["quality"]
        }
        validated = _validate_ai_result(result)
        
        assert validated["sentiment"] == "neutral"  # Should default
        assert validated["topics"] == ["Product Quality"]

    def test_validate_ai_result_topic_count_limit(self):
        """Test topic count limit"""
        # Use actual business topics that will be recognized by the normalizer
        many_topics = ["product quality", "customer service", "shipping", "pricing", "user experience", "payment", "website", "communication", "extra topic"]
        result = {
            "sentiment": "positive",
            "topics": many_topics
        }
        validated = _validate_ai_result(result)
        
        # Should limit to 3 topics (based on the validate function logic)
        assert len(validated["topics"]) == 3


class TestAdjustSentimentWithRating:
    """Test the sentiment adjustment function"""

    def test_adjust_sentiment_no_rating(self):
        """Test adjustment with no rating"""
        result = {"sentiment": "positive", "topics": []}
        adjusted = _adjust_sentiment_with_rating(result, None)
        
        assert adjusted == result  # Should be unchanged

    def test_adjust_sentiment_matching_rating(self):
        """Test adjustment when sentiment matches rating"""
        result = {"sentiment": "positive", "topics": []}
        adjusted = _adjust_sentiment_with_rating(result, 5)
        
        # Should not be adjusted since they match
        assert adjusted["sentiment"] == "positive"
        assert "sentiment_adjusted" not in adjusted

    def test_adjust_sentiment_conflict_low_rating(self):
        """Test adjustment with conflicting low rating"""
        result = {"sentiment": "positive", "topics": []}
        adjusted = _adjust_sentiment_with_rating(result, 1)
        
        assert adjusted["sentiment"] == "negative"  # Should be adjusted
        assert adjusted["sentiment_adjusted"] is True
        assert adjusted["original_ai_sentiment"] == "positive"

    def test_adjust_sentiment_conflict_high_rating(self):
        """Test adjustment with conflicting high rating"""
        result = {"sentiment": "negative", "topics": []}
        adjusted = _adjust_sentiment_with_rating(result, 5)
        
        assert adjusted["sentiment"] == "positive"  # Should be adjusted
        assert adjusted["sentiment_adjusted"] is True
        assert adjusted["original_ai_sentiment"] == "negative"

    def test_adjust_sentiment_neutral_rating(self):
        """Test adjustment with neutral rating"""
        result = {"sentiment": "positive", "topics": []}
        adjusted = _adjust_sentiment_with_rating(result, 3)
        
        assert adjusted["sentiment"] == "neutral"  # Should be adjusted
        assert adjusted["sentiment_adjusted"] is True
        assert adjusted["original_ai_sentiment"] == "positive"


class TestIntegrationScenarios:
    """Test realistic integration scenarios"""

    @pytest.mark.asyncio
    @patch('app.services.ai_service.settings.AI_SERVICE_TYPE', 'local')
    async def test_realistic_positive_feedback_scenario(self):
        """Test realistic positive feedback scenario"""
        text = "Amazing product! Fast shipping and excellent customer service. Highly recommend!"
        rating = 5
        
        result = await analyze_feedback(text, rating)
        
        assert result["sentiment"] == "positive"
        assert isinstance(result["topics"], list)
        assert len(result["topics"]) > 0

    @pytest.mark.asyncio
    @patch('app.services.ai_service.settings.AI_SERVICE_TYPE', 'local')
    async def test_realistic_negative_feedback_scenario(self):
        """Test realistic negative feedback scenario"""
        text = "Terrible experience! Product broke after one day and customer service was unhelpful."
        rating = 1
        
        result = await analyze_feedback(text, rating)
        
        assert result["sentiment"] == "negative"
        assert isinstance(result["topics"], list)
        assert len(result["topics"]) > 0

    @pytest.mark.asyncio
    @patch('app.services.ai_service.settings.AI_SERVICE_TYPE', 'claude')
    @patch('app.services.ai_service.settings.AI_API_KEY', 'test_key')
    @patch('httpx.AsyncClient')
    async def test_claude_api_integration_with_fallback(self, mock_client):
        """Test Claude API integration with automatic fallback"""
        # First call fails, should fallback to local
        mock_client_instance = AsyncMock()
        mock_client_instance.post.side_effect = httpx.TimeoutException("API timeout")
        mock_client.return_value.__aenter__.return_value = mock_client_instance
        
        text = "Great product with excellent quality!"
        result = await analyze_feedback(text)
        
        # Should still get a result from local fallback
        assert result["sentiment"] == "positive"
        assert isinstance(result["topics"], list)
        assert "fallback_used" in result
        assert result["fallback_used"] is True


class TestEdgeCases:
    """Test edge cases and error conditions"""

    @pytest.mark.asyncio
    async def test_very_long_text_handling(self):
        """Test handling of very long text"""
        # Create extremely long text
        long_text = "Great product. " * 1000  # Very long but positive
        
        result = await analyze_feedback(long_text)
        
        assert result["sentiment"] == "positive"
        assert isinstance(result["topics"], list)

    @pytest.mark.asyncio
    async def test_special_characters_handling(self):
        """Test handling of special characters"""
        text = "Amazing product! 🎉 Very good quality 💯 #awesome @company"
        
        result = await analyze_feedback(text)
        
        assert result["sentiment"] == "positive"
        assert isinstance(result["topics"], list)

    @pytest.mark.asyncio
    async def test_only_punctuation_handling(self):
        """Test handling of text with only punctuation"""
        text = "!@#$%^&*()"
        
        result = await analyze_feedback(text)
        
        assert result["sentiment"] == "neutral"
        assert isinstance(result["topics"], list)

    def test_local_analysis_extreme_word_counts(self):
        """Test local analysis with extreme positive/negative word counts"""
        # Text with many positive words
        positive_text = "excellent great awesome love happy satisfied recommend " * 10
        result = analyze_local(positive_text)
        assert result["sentiment"] == "positive"

        # Text with many negative words  
        negative_text = "terrible awful hate disappointed bad poor problem issue " * 10
        result = analyze_local(negative_text)
        assert result["sentiment"] == "negative"


class TestErrorHandlingAndLogging:
    """Test error handling and logging behavior"""

    @pytest.mark.asyncio
    async def test_logging_behavior_empty_input(self, caplog):
        """Test that appropriate warnings are logged for empty input"""
        # Set log level to WARNING to capture warning messages
        caplog.set_level(logging.WARNING)
        
        await analyze_feedback("")
        
        # Should log warning about empty input
        assert "Empty or whitespace-only text provided" in caplog.text

    @pytest.mark.asyncio
    @patch('app.services.ai_service.settings.AI_SERVICE_TYPE', 'claude')
    @patch('app.services.ai_service.analyze_with_claude')
    async def test_logging_behavior_api_failure(self, mock_claude, caplog):
        """Test logging behavior when API fails"""
        # Set log level to INFO to capture both ERROR and INFO messages
        caplog.set_level(logging.INFO)
        
        mock_claude.side_effect = Exception("API Error")
        
        await analyze_feedback("Test text")
        
        # Should log error and fallback information
        assert "Error in AI analysis" in caplog.text
        assert "Falling back to local analysis" in caplog.text

    @pytest.mark.asyncio
    @patch('app.services.ai_service.settings.AI_SERVICE_TYPE', 'invalid_service')
    async def test_unknown_service_type_fallback(self):
        """Test fallback when unknown service type is configured"""
        result = await analyze_feedback("Great product!")
        
        # Should fallback to local analysis
        assert result["sentiment"] == "positive"
        assert isinstance(result["topics"], list)


# Add PropertyMock import for the OpenAI test
from unittest.mock import PropertyMock

if __name__ == "__main__":
    # Run tests with: python -m pytest tests/unit/test_ai_service_comprehensive.py -v
    pytest.main([__file__, "-v"])
