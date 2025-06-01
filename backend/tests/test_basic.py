import pytest
import os

# Set test environment before importing any app modules
os.environ["AI_SERVICE_TYPE"] = "local"
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["SECRET_KEY"] = "test_secret_key_for_testing_only"

def test_environment_setup():
    """Test that our test environment is properly configured"""
    assert os.environ["AI_SERVICE_TYPE"] == "local"
    assert os.environ["SECRET_KEY"] == "test_secret_key_for_testing_only"

def test_basic_imports():
    """Test that we can import core modules"""
    from app.core.config import settings
    assert settings.AI_SERVICE_TYPE == "local"
    assert settings.SECRET_KEY == "test_secret_key_for_testing_only"

def test_ai_service_basic():
    """Test basic AI service functionality"""
    from app.services.ai_service import analyze_local
    
    result = analyze_local("Great product!")
    assert "sentiment" in result
    assert "topics" in result
    assert result["sentiment"] in ["positive", "negative", "neutral"]

def test_password_hashing():
    """Test password hashing functions"""
    from app.routers.auth import get_password_hash, verify_password
    
    password = "testpassword123"
    hashed = get_password_hash(password)
    
    assert hashed != password
    assert verify_password(password, hashed)
    assert not verify_password("wrongpassword", hashed)
