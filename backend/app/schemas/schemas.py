from pydantic import BaseModel, EmailStr, field_validator, ConfigDict
from typing import List, Optional
from datetime import datetime

# Auth schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    business_name: str
    
    @field_validator('password')
    @classmethod
    def password_strength(cls, v):
        errors = []
        if len(v) < 8:
            errors.append('at least 8 characters')
        if not any(c.isupper() for c in v):
            errors.append('one uppercase letter')
        if not any(c.islower() for c in v):
            errors.append('one lowercase letter')
        if not any(c.isdigit() for c in v):
            errors.append('one number')
        
        if errors:
            error_message = ', '.join(errors)
            raise ValueError(f'Password must contain {error_message}')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    business_name: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[int] = None

# Password Reset schemas
class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str
    
    @field_validator('new_password')
    @classmethod
    def password_strength(cls, v):
        errors = []
        if len(v) < 8:
            errors.append('at least 8 characters')
        if not any(c.isupper() for c in v):
            errors.append('one uppercase letter')
        if not any(c.islower() for c in v):
            errors.append('one lowercase letter')
        if not any(c.isdigit() for c in v):
            errors.append('one number')
        
        if errors:
            error_message = ', '.join(errors)
            raise ValueError(f'Password must contain {error_message}')
        return v

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
    
    model_config = ConfigDict(from_attributes=True)

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