import pytest
import os
from unittest.mock import patch, AsyncMock

# Set test environment before importing app modules
os.environ["AI_SERVICE_TYPE"] = "local"
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["SECRET_KEY"] = "test_secret_key_for_testing_only"

from app.services.ai_service import analyze_feedback, analyze_local

class TestLocalAnalysis:
    def test_positive_sentiment(self):
        """Test positive sentiment detection"""
        text = "This product is excellent and I love it"
        result = analyze_local(text)
        
        assert result["sentiment"] == "positive"
        assert isinstance(result["topics"], list)

    def test_negative_sentiment(self):
        """Test negative sentiment detection"""
        text = "This product is terrible and I hate it"
        result = analyze_local(text)
        
        assert result["sentiment"] == "negative"
        assert isinstance(result["topics"], list)

    def test_neutral_sentiment(self):
        """Test neutral sentiment detection"""
        text = "This is a product that exists"
        result = analyze_local(text)
        
        assert result["sentiment"] == "neutral"
        assert isinstance(result["topics"], list)

    def test_rating_based_sentiment(self):
        """Test sentiment analysis with rating"""
        text = "Okay product"  # Neutral text
        
        # High rating should override neutral text
        result = analyze_local(text, rating=5)
        assert result["sentiment"] == "positive"
        
        # Low rating should override neutral text
        result = analyze_local(text, rating=1)
        assert result["sentiment"] == "negative"
        
        # Middle rating should stay neutral
        result = analyze_local(text, rating=3)
        assert result["sentiment"] == "neutral"

    def test_topic_extraction(self):
        """Test basic topic extraction"""
        text = "The shipping was fast but the product quality was poor"
        result = analyze_local(text)
        
        topics = result["topics"]
        assert "shipping" in topics
        assert "product quality" in topics

class TestAIServiceIntegration:
    @pytest.mark.asyncio
    async def test_analyze_feedback_local_fallback(self):
        """Test that analyze_feedback falls back to local analysis"""
        # This will use local analysis since AI_SERVICE_TYPE is "local" in tests
        text = "Great product, excellent quality"
        result = await analyze_feedback(text)
        
        assert "sentiment" in result
        assert "topics" in result
        assert result["sentiment"] in ["positive", "negative", "neutral"]

    @pytest.mark.asyncio
    async def test_analyze_feedback_with_api_failure(self):
        """Test graceful fallback when API fails"""
        
        # Create an async mock that raises an exception
        async def mock_claude_failure(text):
            raise Exception("API Error")
        
        # Mock the analyze_with_claude function to fail
        with patch('app.services.ai_service.analyze_with_claude', side_effect=mock_claude_failure):
            # Set AI service type to claude to trigger the API call
            with patch('app.services.ai_service.settings.AI_SERVICE_TYPE', 'claude'):
                text = "Test feedback"
                result = await analyze_feedback(text)
        
        # Should still return a result via local analysis fallback
        assert "sentiment" in result
        assert "topics" in result
        assert result["sentiment"] in ["positive", "negative", "neutral"]
        assert isinstance(result["topics"], list)
