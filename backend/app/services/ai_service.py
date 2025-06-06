import logging
from typing import Dict, List, Any
import httpx
from ..core.config import settings

# Set up logging
logger = logging.getLogger(__name__)

async def analyze_feedback(text: str, rating: int = None) -> Dict[str, Any]:
    """
    Analyze feedback text to extract sentiment and topics
    This implementation can use both text analysis and rating for sentiment determination
    """
    # Validate input
    if not text or not text.strip():
        logger.warning("Empty or whitespace-only text provided for analysis")
        return {
            "sentiment": "neutral",
            "topics": [],
            "error": "Empty input text"
        }
    
    result = None
    error_details = None
    
    try:
        if settings.AI_SERVICE_TYPE == "claude":
            logger.info("Attempting Claude API analysis")
            result = await analyze_with_claude(text, rating)
        elif settings.AI_SERVICE_TYPE == "openai":
            logger.info("Attempting OpenAI API analysis")
            result = await analyze_with_openai(text, rating)
        else:
            logger.info("Using local analysis (no AI service configured)")
            result = analyze_local(text, rating)
    except Exception as e:
        error_details = str(e)
        logger.error(f"Error in AI analysis: {error_details}")
        logger.info("Falling back to local analysis")
        result = analyze_local(text, rating)
    
    # Validate result
    if not result or not isinstance(result, dict):
        logger.error("AI service returned invalid result, using local analysis")
        result = analyze_local(text, rating)
    
    # Ensure required fields exist
    if "sentiment" not in result:
        logger.warning("Missing sentiment in AI result, defaulting to neutral")
        result["sentiment"] = "neutral"
    
    if "topics" not in result:
        logger.warning("Missing topics in AI result, defaulting to empty list")
        result["topics"] = []
    
    # Validate sentiment value
    valid_sentiments = ["positive", "negative", "neutral"]
    if result["sentiment"] not in valid_sentiments:
        logger.warning(f"Invalid sentiment '{result['sentiment']}', defaulting to neutral")
        result["sentiment"] = "neutral"
    
    # Validate topics is a list
    if not isinstance(result["topics"], list):
        logger.warning(f"Topics is not a list: {type(result['topics'])}, converting")
        topics = result["topics"]
        if topics:
            result["topics"] = [str(topics)] if not isinstance(topics, list) else topics
        else:
            result["topics"] = []
    
    # If rating is provided, we can further adjust the sentiment
    if rating is not None and settings.AI_SERVICE_TYPE in ["claude", "openai"]:
        result = _adjust_sentiment_with_rating(result, rating)
    
    # Add error details if any occurred
    if error_details:
        result["ai_error"] = error_details
        result["fallback_used"] = True
    
    logger.info(f"Final analysis result: sentiment={result['sentiment']}, topics_count={len(result['topics'])}")
    return result

async def analyze_with_claude(text: str, rating: int = None) -> Dict[str, Any]:
    """
    Analyze feedback using Claude API with comprehensive error handling
    """
    # Check if API key is configured
    if not settings.AI_API_KEY or settings.AI_API_KEY.strip() == "":
        logger.warning("No Claude API key configured, falling back to local analysis")
        raise ValueError("Claude API key not configured")
    
    # Validate and sanitize input
    if not text or len(text.strip()) == 0:
        raise ValueError("Empty text provided for analysis")
    
    # Truncate very long text to avoid API limits
    max_text_length = 8000  # Conservative limit for Claude
    if len(text) > max_text_length:
        logger.warning(f"Text truncated from {len(text)} to {max_text_length} characters")
        text = text[:max_text_length] + "..."
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": settings.AI_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": settings.AI_MODEL_NAME or "claude-3-haiku-20240307",
                    "max_tokens": 1000,
                    "messages": [
                        {
                            "role": "user",
                            "content": f"""Analyze this customer feedback and return only a JSON object with:
1. sentiment: "positive", "negative", or "neutral"
2. topics: an array of up to 5 key topics/themes (short phrases, max 50 chars each)

Feedback: "{text}"

Return only the JSON object, no other text:"""
                        }
                    ]
                }
            )
            
            # Handle different HTTP status codes
            if response.status_code == 401:
                logger.error("Claude API authentication failed - check API key")
                raise httpx.HTTPStatusError("Authentication failed", request=response.request, response=response)
            elif response.status_code == 429:
                logger.error("Claude API rate limit exceeded")
                raise httpx.HTTPStatusError("Rate limit exceeded", request=response.request, response=response)
            elif response.status_code >= 500:
                logger.error(f"Claude API server error: {response.status_code}")
                raise httpx.HTTPStatusError("Server error", request=response.request, response=response)
            elif response.status_code != 200:
                logger.error(f"Unexpected Claude API response: {response.status_code}")
                raise httpx.HTTPStatusError(f"Unexpected status: {response.status_code}", request=response.request, response=response)
            
            # Parse response
            try:
                api_result = response.json()
            except Exception as e:
                logger.error(f"Failed to parse Claude API response as JSON: {str(e)}")
                raise ValueError("Invalid JSON response from Claude API")
            
            # Extract content
            content = api_result.get("content", [])
            if not content or not isinstance(content, list) or len(content) == 0:
                logger.error("No content in Claude API response")
                raise ValueError("Empty content in Claude API response")
            
            text_content = content[0].get("text", "")
            if not text_content:
                logger.error("No text content in Claude API response")
                raise ValueError("No text in Claude API response")
            
            # Extract and parse JSON from response
            parsed_result = _extract_json_from_text(text_content)
            
            # Validate the parsed result
            validated_result = _validate_ai_result(parsed_result)
            
            logger.info("Successfully analyzed feedback with Claude API")
            return validated_result
            
    except httpx.TimeoutException:
        logger.error("Claude API request timed out")
        raise ConnectionError("Claude API timeout")
    except httpx.ConnectError:
        logger.error("Failed to connect to Claude API")
        raise ConnectionError("Claude API connection failed")
    except httpx.HTTPStatusError as e:
        logger.error(f"Claude API HTTP error: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error calling Claude API: {str(e)}")
        raise

async def analyze_with_openai(text: str, rating: int = None) -> Dict[str, Any]:
    """
    Analyze feedback using OpenAI API with comprehensive error handling
    """
    # Check if API key is configured
    if not settings.AI_API_KEY or settings.AI_API_KEY.strip() == "":
        logger.warning("No OpenAI API key configured, falling back to local analysis")
        raise ValueError("OpenAI API key not configured")
    
    # Validate and sanitize input
    if not text or len(text.strip()) == 0:
        raise ValueError("Empty text provided for analysis")
    
    # Truncate very long text to avoid API limits
    max_text_length = 8000  # Conservative limit for OpenAI
    if len(text) > max_text_length:
        logger.warning(f"Text truncated from {len(text)} to {max_text_length} characters")
        text = text[:max_text_length] + "..."
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.AI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": getattr(settings, 'OPENAI_MODEL_NAME', 'gpt-3.5-turbo'),
                    "messages": [
                        {
                            "role": "user",
                            "content": f"""Analyze this customer feedback and return only a JSON object with:
1. sentiment: "positive", "negative", or "neutral"
2. topics: an array of up to 5 key topics/themes (short phrases, max 50 chars each)

Feedback: "{text}"

Return only the JSON object, no other text:"""
                        }
                    ],
                    "max_tokens": 1000,
                    "temperature": 0.3
                }
            )
            
            # Handle different HTTP status codes
            if response.status_code == 401:
                logger.error("OpenAI API authentication failed - check API key")
                raise httpx.HTTPStatusError("Authentication failed", request=response.request, response=response)
            elif response.status_code == 429:
                logger.error("OpenAI API rate limit exceeded")
                raise httpx.HTTPStatusError("Rate limit exceeded", request=response.request, response=response)
            elif response.status_code >= 500:
                logger.error(f"OpenAI API server error: {response.status_code}")
                raise httpx.HTTPStatusError("Server error", request=response.request, response=response)
            elif response.status_code != 200:
                logger.error(f"Unexpected OpenAI API response: {response.status_code}")
                raise httpx.HTTPStatusError(f"Unexpected status: {response.status_code}", request=response.request, response=response)
            
            # Parse response
            try:
                api_result = response.json()
            except Exception as e:
                logger.error(f"Failed to parse OpenAI API response as JSON: {str(e)}")
                raise ValueError("Invalid JSON response from OpenAI API")
            
            # Extract content
            choices = api_result.get("choices", [])
            if not choices or len(choices) == 0:
                logger.error("No choices in OpenAI API response")
                raise ValueError("Empty choices in OpenAI API response")
            
            message = choices[0].get("message", {})
            text_content = message.get("content", "")
            if not text_content:
                logger.error("No content in OpenAI API response")
                raise ValueError("No content in OpenAI API response")
            
            # Extract and parse JSON from response
            parsed_result = _extract_json_from_text(text_content)
            
            # Validate the parsed result
            validated_result = _validate_ai_result(parsed_result)
            
            logger.info("Successfully analyzed feedback with OpenAI API")
            return validated_result
            
    except httpx.TimeoutException:
        logger.error("OpenAI API request timed out")
        raise ConnectionError("OpenAI API timeout")
    except httpx.ConnectError:
        logger.error("Failed to connect to OpenAI API")
        raise ConnectionError("OpenAI API connection failed")
    except httpx.HTTPStatusError as e:
        logger.error(f"OpenAI API HTTP error: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error calling OpenAI API: {str(e)}")
        raise

def analyze_local(text: str, rating: int = None) -> Dict[str, Any]:
    """
    Simple rule-based sentiment and topic analysis
    This version can incorporate the rating value if provided
    """
    logger.info(f"Using local analysis for text: '{text[:50]}...'")
    
    # Validate input
    if not text or not text.strip():
        logger.warning("Empty text provided to local analysis")
        return {
            "sentiment": "neutral",
            "topics": [],
            "method": "local_fallback"
        }
    
    # First determine sentiment based on text analysis
    # Simple sentiment analysis based on keyword matching
    positive_words = ["good", "great", "excellent", "awesome", "love", "happy", "satisfied", "recommend"]
    negative_words = ["bad", "poor", "terrible", "awful", "hate", "disappointed", "dissatisfied", "problem", "issue"]
    
    text_lower = text.lower()
    
    # Count positive and negative words
    positive_count = sum(1 for word in positive_words if word in text_lower)
    negative_count = sum(1 for word in negative_words if word in text_lower)
    
    # Log word counts
    logger.debug(f"Positive words: {positive_count}, Negative words: {negative_count}")
    
    # Determine text-based sentiment
    if positive_count > negative_count:
        text_sentiment = "positive"
    elif negative_count > positive_count:
        text_sentiment = "negative"
    else:
        text_sentiment = "neutral"
    
    # If rating is provided, use it to determine or override sentiment
    if rating is not None:
        # Define rating thresholds
        # For a 5-star rating system: 1-2 = negative, 3 = neutral, 4-5 = positive
        if rating <= 2:  # Low rating
            rating_sentiment = "negative"
        elif rating == 3:  # Middle rating
            rating_sentiment = "neutral"
        else:  # High rating
            rating_sentiment = "positive"
        
        # If text sentiment conflicts with rating-based sentiment, use a weighted approach
        if text_sentiment != rating_sentiment:
            logger.debug(f"Sentiment conflict - Text: {text_sentiment}, Rating: {rating_sentiment}")
            
            # Prioritize rating over text analysis for final sentiment
            final_sentiment = rating_sentiment
        else:
            # Both agree, use either
            final_sentiment = rating_sentiment
    else:
        # No rating provided, use text-based sentiment
        final_sentiment = text_sentiment
    
    # Very simple topic extraction based on common business aspects
    topics = []
    topic_keywords = {
        "shipping speed": ["shipping", "delivery", "arrive", "package", "fast", "quick", "slow"],
        "product quality": ["quality", "durability", "material", "broke", "damaged", "excellent", "defective"],
        "customer service": ["service", "support", "representative", "help", "assistance", "staff", "friendly"],
        "price": ["price", "cost", "expensive", "cheap", "afford", "value", "money"],
        "website": ["website", "site", "online", "checkout", "cart", "app"],
        "overall satisfaction": ["satisfied", "happy", "pleased", "disappointed", "recommend", "love", "hate"]
    }
    
    # Check for topic keywords in text
    for topic, keywords in topic_keywords.items():
        if any(keyword in text_lower for keyword in keywords):
            topics.append(topic)
            logger.debug(f"Found topic: {topic}")
    
    # Ensure we always return a list for topics
    topics = topics[:5] if topics else []
    
    logger.info(f"Local analysis result: sentiment={final_sentiment}, topics={topics}")
    
    # Ensure the result always returns a list for topics
    return {
        "sentiment": final_sentiment,
        "topics": topics,  # This will always be a Python list
        "method": "local_analysis"
    }


def _extract_json_from_text(text: str) -> Dict[str, Any]:
    """
    Extract JSON object from text response, handling various formats
    """
    import json
    import re
    
    # First try to parse the entire text as JSON
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    
    # Try to find JSON object in the text
    json_patterns = [
        r'\{[^{}]*"sentiment"[^{}]*"topics"[^{}]*\}',  # Look for sentiment and topics
        r'\{.*?\}',  # Any JSON object
        r'```json\s*({.*?})\s*```',  # JSON in code blocks
        r'```\s*({.*?})\s*```',  # JSON in generic code blocks
    ]
    
    for pattern in json_patterns:
        matches = re.findall(pattern, text, re.DOTALL | re.IGNORECASE)
        for match in matches:
            try:
                return json.loads(match)
            except json.JSONDecodeError:
                continue
    
    # If no valid JSON found, try to extract sentiment and topics with regex
    logger.warning(f"Could not parse JSON from AI response: {text[:200]}...")
    
    # Extract sentiment with regex (simplified to avoid syntax errors)
    sentiment_match = re.search(r'sentiment\s*:\s*["\']?(positive|negative|neutral)["\']?', text, re.IGNORECASE)
    sentiment = sentiment_match.group(1).lower() if sentiment_match else "neutral"
    
    # Extract topics with regex (simplified)
    topics = []
    topics_pattern = r'topics\s*:\s*\[(.*?)\]'
    topics_match = re.search(topics_pattern, text, re.IGNORECASE | re.DOTALL)
    if topics_match:
        topics_text = topics_match.group(1)
        # Extract quoted strings
        topic_matches = re.findall(r'["\']([^"\']*)["\']', topics_text)
        topics = [topic.strip() for topic in topic_matches if topic.strip()][:5]
    
    logger.warning(f"Extracted using regex - sentiment: {sentiment}, topics: {topics}")
    
    return {
        "sentiment": sentiment,
        "topics": topics
    }


def _validate_ai_result(result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate and clean AI analysis result
    """
    if not isinstance(result, dict):
        logger.error(f"AI result is not a dictionary: {type(result)}")
        raise ValueError("Invalid AI result format")
    
    # Validate sentiment
    sentiment = result.get("sentiment", "neutral")
    valid_sentiments = ["positive", "negative", "neutral"]
    if sentiment not in valid_sentiments:
        logger.warning(f"Invalid sentiment '{sentiment}', defaulting to neutral")
        sentiment = "neutral"
    
    # Validate topics
    topics = result.get("topics", [])
    if not isinstance(topics, list):
        logger.warning(f"Topics is not a list: {type(topics)}, converting")
        if topics:
            topics = [str(topics)]
        else:
            topics = []
    
    # Clean and limit topics
    clean_topics = []
    for topic in topics:
        if topic and isinstance(topic, (str, int, float)):
            topic_str = str(topic).strip()
            if topic_str and len(topic_str) <= 50:  # Max 50 chars per topic
                clean_topics.append(topic_str)
        if len(clean_topics) >= 5:  # Max 5 topics
            break
    
    return {
        "sentiment": sentiment,
        "topics": clean_topics
    }


def _adjust_sentiment_with_rating(result: Dict[str, Any], rating: int) -> Dict[str, Any]:
    """
    Adjust AI sentiment based on rating if there's a conflict
    """
    if rating is None:
        return result
    
    # Define rating thresholds
    if rating <= 2:
        rating_sentiment = "negative"
    elif rating == 3:
        rating_sentiment = "neutral"
    else:
        rating_sentiment = "positive"
    
    ai_sentiment = result.get("sentiment")
    if ai_sentiment and ai_sentiment != rating_sentiment:
        logger.info(f"Sentiment mismatch - AI: {ai_sentiment}, Rating: {rating_sentiment}, Rating: {rating}")
        logger.info("Prioritizing rating-based sentiment")
        result["sentiment"] = rating_sentiment
        result["sentiment_adjusted"] = True
        result["original_ai_sentiment"] = ai_sentiment
    
    return result
