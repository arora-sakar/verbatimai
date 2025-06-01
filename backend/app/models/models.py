from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    business_name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    feedback_items = relationship("FeedbackItem", back_populates="owner")
    
class FeedbackItem(Base):
    __tablename__ = "feedback_items"
    
    id = Column(Integer, primary_key=True, index=True)
    feedback_text = Column(Text, nullable=False)
    source = Column(String, nullable=False)  # 'csv', 'gmb', 'web_widget'
    rating = Column(Integer, nullable=True)  # 1-5 star rating if available
    sentiment = Column(String, nullable=True)  # 'positive', 'negative', 'neutral'
    topics = Column(JSON, nullable=True)  # Array of extracted topics stored as JSON
    customer_name = Column(String, nullable=True)
    customer_email = Column(String, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    owner = relationship("User", back_populates="feedback_items")