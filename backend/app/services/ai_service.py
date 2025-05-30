from typing import Dict, List, Any
import httpx
from ..core.config import settings

async def analyze_feedback(text: str, rating: int = None) -> Dict[str, Any]:
    """
    Analyze feedback text to extract sentiment and topics
    This implementation can use both text analysis and rating for sentiment determination
    """
    if settings.AI_SERVICE_TYPE == "claude":
        result = await analyze_with_claude(text)
    elif settings.AI_SERVICE_TYPE == "openai":
        result = await analyze_with_openai(text)
    else:
        # Fallback to simple rule-based analysis
        result = analyze_local(text, rating)
    
    # If rating is provided, we can further adjust the sentiment
    # Note: We do this here as a fallback only if it wasn't already handled
    # by the analyze_local function
    if rating is not None and "claude" in settings.AI_SERVICE_TYPE or "openai" in settings.AI_SERVICE_TYPE:
        # Define rating thresholds
        # For a 5-star rating system: 1-2 = negative, 3 = neutral, 4-5 = positive
        if rating <= 2:  # Low rating
            rating_sentiment = "negative"
        elif rating == 3:  # Middle rating
            rating_sentiment = "neutral"
        else:  # High rating
            rating_sentiment = "positive"
        
        # If AI sentiment conflicts with rating-based sentiment, prioritize rating
        # But log the discrepancy for potential review
        ai_sentiment = result.get("sentiment")
        if ai_sentiment and ai_sentiment != rating_sentiment:
            print(f"Sentiment mismatch - AI: {ai_sentiment}, Rating-based: {rating_sentiment}, Rating: {rating}")
            result["sentiment"] = rating_sentiment
            
    return result

async def analyze_with_claude(text: str) -> Dict[str, Any]:
    """Analyze feedback using Claude API"""
    # In a real implementation, you would call the Claude API
    # For now, we'll just simulate the response
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": settings.AI_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": settings.AI_MODEL_NAME,
                    "max_tokens": 1000,
                    "messages": [
                        {
                            "role": "user",
                            "content": f"""Analyze the following customer feedback and return a JSON object with:
1. sentiment: "positive", "negative", or "neutral"
2. topics: an array of up to 5 key topics/themes mentioned (each a short phrase, max 50 chars)

Feedback: "{text}"

JSON response:"""
                        }
                    ]
                },
                timeout=10.0,
            )
            
            # Check for successful response
            if response.status_code == 200:
                result = response.json()
                content = result.get("content", [{}])[0].get("text", "")
                
                # Extract JSON from response
                import json
                import re
                
                # Find JSON in response
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    json_str = json_match.group(0)
                    try:
                        return json.loads(json_str)
                    except:
                        pass
            
            # Fallback to local analysis if API call fails
            return analyze_local(text)
    except Exception as e:
        print(f"Error calling Claude API: {str(e)}")
        return analyze_local(text)

async def analyze_with_openai(text: str) -> Dict[str, Any]:
    """Analyze feedback using OpenAI API"""
    # Similar implementation as Claude, but using OpenAI API
    # For now, fallback to local analysis
    return analyze_local(text)

def analyze_local(text: str, rating: int = None) -> Dict[str, Any]:
    """
    Simple rule-based sentiment and topic analysis
    This version can incorporate the rating value if provided
    """
    print(f"Using local analysis for text: '{text[:50]}...'")
    
    # First determine sentiment based on text analysis
    # Simple sentiment analysis based on keyword matching
    positive_words = ["good", "great", "excellent", "awesome", "love", "happy", "satisfied", "recommend"]
    negative_words = ["bad", "poor", "terrible", "awful", "hate", "disappointed", "dissatisfied", "problem", "issue"]
    
    text_lower = text.lower()
    
    # Count positive and negative words
    positive_count = sum(1 for word in positive_words if word in text_lower)
    negative_count = sum(1 for word in negative_words if word in text_lower)
    
    # Log word counts
    print(f"Positive words: {positive_count}, Negative words: {negative_count}")
    
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
            print(f"Sentiment conflict - Text: {text_sentiment}, Rating: {rating_sentiment}")
            
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
        "shipping": ["shipping", "delivery", "arrive", "package"],
        "product quality": ["quality", "durability", "material", "broke", "damaged"],
        "customer service": ["service", "support", "representative", "help", "assistance"],
        "price": ["price", "cost", "expensive", "cheap", "afford"],
        "website": ["website", "site", "online", "checkout", "cart"]
    }
    
    # Check for topic keywords in text
    for topic, keywords in topic_keywords.items():
        if any(keyword in text_lower for keyword in keywords):
            topics.append(topic)
            print(f"Found topic: {topic}")
    
    # Limit to 5 topics
    topics = topics[:5]
    
    print(f"Local analysis result: sentiment={final_sentiment}, topics={topics}")
    
    return {
        "sentiment": final_sentiment,
        "topics": topics
    }