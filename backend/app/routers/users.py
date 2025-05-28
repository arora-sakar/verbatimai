from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any

from ..db.database import get_db
from ..models.models import User
from ..schemas.schemas import UserResponse
from ..routers.auth import get_current_user

router = APIRouter()

@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user profile information"""
    return current_user

@router.put("/me", response_model=UserResponse)
def update_user_info(
    business_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update current user's business name"""
    # Update user info
    current_user.business_name = business_name
    db.commit()
    db.refresh(current_user)
    
    return current_user