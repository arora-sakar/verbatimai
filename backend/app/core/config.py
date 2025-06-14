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
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
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
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        print(f"🔍 DEBUG: DATABASE_URL from env: {os.getenv('DATABASE_URL', 'NOT_SET')[:50]}...")
        print(f"🔍 DEBUG: Final DATABASE_URL: {self.DATABASE_URL[:50]}...")
    
    # CORS settings - dynamically set based on environment
    @property
    def CORS_ORIGINS(self) -> List[str]:
        # Default development origins
        origins = [
            "http://localhost:3000",  # React dev server
            "http://localhost:8000",  # FastAPI server
        ]
        
        # Add production origins from environment variable
        backend_cors_origins = os.getenv("BACKEND_CORS_ORIGINS")
        print(f"🔍 DEBUG: BACKEND_CORS_ORIGINS = {backend_cors_origins}")
        
        if backend_cors_origins:
            try:
                import json
                prod_origins = json.loads(backend_cors_origins)
                origins.extend(prod_origins)
                print(f"🔍 DEBUG: Parsed JSON CORS origins: {prod_origins}")
            except json.JSONDecodeError as e:
                print(f"⚠️  DEBUG: JSON decode failed: {e}")
                # If not JSON, treat as comma-separated list
                prod_origins = [origin.strip() for origin in backend_cors_origins.split(",")]
                origins.extend(prod_origins)
                print(f"🔍 DEBUG: Parsed CSV CORS origins: {prod_origins}")
        
        print(f"🔍 DEBUG: Final CORS origins: {origins}")
        return origins
    
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
        case_sensitive=True,
        extra="ignore"  # Ignore extra environment variables
    )

settings = Settings()