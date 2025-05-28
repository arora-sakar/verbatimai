from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Dict, Any
from collections import Counter

from ..db.database import get_db
from ..models.models import User, FeedbackItem
from ..schemas.schemas import AnalyticsSummary, SentimentSummary, TopicCount
from ..routers.auth import get_current_user

router = APIRouter()

@router.get("/summary", response_model=AnalyticsSummary)
async def get_analytics_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a summary of feedback analytics"""
    # Get all feedback for the current user
    user_feedback = db.query(FeedbackItem).filter(
        FeedbackItem.owner_id == current_user.id,
        FeedbackItem.sentiment.isnot(None)  # Only include analyzed feedback
    ).all()
    
    # Calculate sentiment breakdown
    sentiment_counts = {"positive": 0, "negative": 0, "neutral": 0, "total": 0}
    
    # For tracking topics
    positive_topics = []
    negative_topics = []
    
    for item in user_feedback:
        # Count sentiments
        if item.sentiment:
            sentiment_counts[item.sentiment] += 1
            sentiment_counts["total"] += 1
        
        # Collect topics by sentiment
        if item.topics:
            if item.sentiment == "positive":
                positive_topics.extend(item.topics)
            elif item.sentiment == "negative":
                negative_topics.extend(item.topics)
    
    # Get top topics
    top_positive_topics = [
        {"topic": topic, "count": count}
        for topic, count in Counter(positive_topics).most_common(5)
    ]
    
    top_negative_topics = [
        {"topic": topic, "count": count}
        for topic, count in Counter(negative_topics).most_common(5)
    ]
    
    # Create response
    return {
        "sentiment": {
            "positive": sentiment_counts["positive"],
            "negative": sentiment_counts["negative"],
            "neutral": sentiment_counts["neutral"],
            "total": sentiment_counts["total"],
        },
        "top_positive_topics": top_positive_topics,
        "top_negative_topics": top_negative_topics,
    }

@router.get("/sources")
async def get_feedback_by_source(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a breakdown of feedback by source"""
    # Query the database for source counts
    source_counts = db.query(
        FeedbackItem.source,
        func.count(FeedbackItem.id).label("count")
    ).filter(
        FeedbackItem.owner_id == current_user.id
    ).group_by(
        FeedbackItem.source
    ).all()
    
    # Format the results
    result = [{"source": source, "count": count} for source, count in source_counts]
    
    return result