from typing import Dict, List, Any
import httpx
from ..core.config import settings

async def analyze_feedback(text: str) -> Dict[str, Any]:
    """
    Analyze feedback text to extract sentiment and topics
    This is a simple implementation that would connect to Claude or another LLM API
    In a real application, you would implement proper error handling and retry logic
    """
    if settings.AI_SERVICE_TYPE == "claude":
        return await analyze_with_claude(text)
    elif settings.AI_SERVICE_TYPE == "openai":
        return await analyze_with_openai(text)
    else:
        # Fallback to simple rule-based analysis
        return analyze_local(text)

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

def analyze_local(text: str) -> Dict[str, Any]:
    """
    Simple rule-based sentiment and topic analysis
    This is a very basic implementation for fallback purposes
    """
    # Simple sentiment analysis based on keyword matching
    positive_words = ["good", "great", "excellent", "awesome", "love", "happy", "satisfied", "recommend"]
    negative_words = ["bad", "poor", "terrible", "awful", "hate", "disappointed", "dissatisfied", "problem", "issue"]
    
    text_lower = text.lower()
    
    # Count positive and negative words
    positive_count = sum(1 for word in positive_words if word in text_lower)
    negative_count = sum(1 for word in negative_words if word in text_lower)
    
    # Determine sentiment
    if positive_count > negative_count:
        sentiment = "positive"
    elif negative_count > positive_count:
        sentiment = "negative"
    else:
        sentiment = "neutral"
    
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
    
    # Limit to 5 topics
    topics = topics[:5]
    
    return {
        "sentiment": sentiment,
        "topics": topics
    }