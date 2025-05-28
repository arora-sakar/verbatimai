from pydantic import BaseModel, EmailStr, validator
from typing import List, Optional
from datetime import datetime

# Auth schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    business_name: str
    
    @validator('password')
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    business_name: str
    created_at: datetime
    
    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[int] = None

# Feedback schemas
class FeedbackCreate(BaseModel):
    feedback_text: str
    source: str
    rating: Optional[int] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None

class FeedbackResponse(BaseModel):
    id: int
    feedback_text: str
    source: str
    rating: Optional[int] = None
    sentiment: Optional[str] = None
    topics: Optional[List[str]] = None
    created_at: datetime
    
    class Config:
        orm_mode = True

# Analytics schemas
class SentimentSummary(BaseModel):
    positive: int
    negative: int
    neutral: int
    total: int

class TopicCount(BaseModel):
    topic: str
    count: int

class AnalyticsSummary(BaseModel):
    sentiment: SentimentSummary
    top_positive_topics: List[TopicCount]
    top_negative_topics: List[TopicCount]