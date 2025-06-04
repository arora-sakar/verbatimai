from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import List
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    # App settings
    PROJECT_NAME: str = "VerbatimAI"
    API_V1_STR: str = "/api"
    APP_ENV: str = os.getenv("APP_ENV", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    
    # Security settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "DEV_SECRET_KEY_CHANGE_IN_PRODUCTION")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 1 week
    
    # Database settings
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://sakar@localhost:5432/verbatimai"
    )
    
    # CORS settings
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",  # React dev server
        "http://localhost:8000",  # FastAPI server
    ]
    
    # AI Service settings
    AI_SERVICE_TYPE: str = os.getenv("AI_SERVICE_TYPE", "claude")  # claude, openai, local
    AI_API_KEY: str = os.getenv("AI_API_KEY", "")
    AI_MODEL_NAME: str = os.getenv("AI_MODEL_NAME", "claude-3-5-sonnet-20241022")
    
    # File upload settings
    MAX_UPLOAD_SIZE: int = 5 * 1024 * 1024  # 5MB
    
    # Pagination settings
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100
    
    # Free tier limits
    FREE_TIER_FEEDBACK_LIMIT: int = 100
    
    # Email settings (for password reset)
    EMAIL_USERNAME: str = os.getenv("EMAIL_USERNAME", "")
    EMAIL_PASSWORD: str = os.getenv("EMAIL_PASSWORD", "")
    FROM_EMAIL: str = os.getenv("FROM_EMAIL", "noreply@verbatimai.com")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    model_config = ConfigDict(
        env_file=".env",
        case_sensitive=True
    )

settings = Settings()