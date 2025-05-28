from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import pandas as pd
import io

from ..db.database import get_db
from ..models.models import User, FeedbackItem
from ..schemas.schemas import FeedbackCreate, FeedbackResponse
from ..routers.auth import get_current_user
from ..services.ai_service import analyze_feedback
from ..core.config import settings

router = APIRouter()

@router.post("/", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
async def create_feedback(
    feedback_data: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a single feedback item"""
    # Check usage limits
    if await check_usage_limits(db, current_user):
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Free tier limit of {settings.FREE_TIER_FEEDBACK_LIMIT} feedback items per month reached",
        )
    
    # Create feedback item
    new_feedback = FeedbackItem(
        feedback_text=feedback_data.feedback_text,
        source=feedback_data.source,
        rating=feedback_data.rating,
        customer_name=feedback_data.customer_name,
        customer_email=feedback_data.customer_email,
        owner_id=current_user.id,
    )
    
    db.add(new_feedback)
    db.commit()
    db.refresh(new_feedback)
    
    # Analyze feedback asynchronously
    await analyze_and_update_feedback(db, new_feedback)
    
    return new_feedback

@router.post("/upload-csv", response_model=dict, status_code=status.HTTP_201_CREATED)
async def upload_csv_feedback(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload and process CSV file with feedback"""
    # Check file size
    if file.size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds the {settings.MAX_UPLOAD_SIZE / (1024 * 1024)}MB limit",
        )
    
    # Read CSV file
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        # Validate CSV structure
        if 'feedback_text' not in df.columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CSV must contain a 'feedback_text' column",
            )
        
        # Map columns
        columns_map = {
            'date': 'created_at',
            'source': 'source',
            'customer_id': 'customer_name',
        }
        
        # Process each row
        created_count = 0
        failed_count = 0
        
        for _, row in df.iterrows():
            # Check usage limits
            if await check_usage_limits(db, current_user):
                break
            
            try:
                feedback_data = {
                    'feedback_text': row['feedback_text'],
                    'source': row.get('source', 'CSV Upload'),
                    'customer_name': row.get('customer_id', None),
                    'owner_id': current_user.id,
                }
                
                new_feedback = FeedbackItem(**feedback_data)
                db.add(new_feedback)
                created_count += 1
            except Exception:
                failed_count += 1
        
        # Commit all changes
        db.commit()
        
        # Process all feedback asynchronously
        # In a real implementation, this would be done by a background worker
        
        return {
            "status": "success",
            "created": created_count,
            "failed": failed_count,
            "total": created_count + failed_count,
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error processing CSV file: {str(e)}",
        )

@router.get("/", response_model=List[FeedbackResponse])
async def get_feedback(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    sentiment: Optional[str] = Query(None, regex="^(positive|negative|neutral)$"),
    source: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get paginated feedback items with optional filtering"""
    query = db.query(FeedbackItem).filter(FeedbackItem.owner_id == current_user.id)
    
    # Apply filters
    if sentiment:
        query = query.filter(FeedbackItem.sentiment == sentiment)
    
    if source:
        query = query.filter(FeedbackItem.source == source)
    
    if search:
        query = query.filter(FeedbackItem.feedback_text.ilike(f"%{search}%"))
    
    # Apply pagination
    total = query.count()
    items = query.order_by(FeedbackItem.created_at.desc()).offset(skip).limit(limit).all()
    
    return items

@router.get("/{feedback_id}", response_model=FeedbackResponse)
async def get_feedback_by_id(
    feedback_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific feedback item by ID"""
    feedback = db.query(FeedbackItem).filter(
        FeedbackItem.id == feedback_id,
        FeedbackItem.owner_id == current_user.id
    ).first()
    
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found",
        )
    
    return feedback

# Helper functions
async def check_usage_limits(db: Session, user: User) -> bool:
    """Check if user has reached the free tier feedback limit"""
    # This is a simplified implementation
    # In a real app, you'd track monthly usage and reset counters
    
    # Count feedback items for current user
    count = db.query(FeedbackItem).filter(FeedbackItem.owner_id == user.id).count()
    
    # Return True if limit reached
    return count >= settings.FREE_TIER_FEEDBACK_LIMIT

async def analyze_and_update_feedback(db: Session, feedback: FeedbackItem):
    """Analyze feedback using AI service and update the database"""
    try:
        # Call AI service to analyze feedback
        result = await analyze_feedback(feedback.feedback_text)
        
        # Update feedback with analysis results
        feedback.sentiment = result.get("sentiment")
        feedback.topics = result.get("topics", [])
        feedback.processed_at = datetime.now()
        
        db.commit()
    except Exception as e:
        print(f"Error analyzing feedback: {str(e)}")
        # In a real app, you'd want better error handling and retry logic