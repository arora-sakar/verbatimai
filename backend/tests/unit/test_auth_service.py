import pytest
import os
from jose import jwt
from datetime import datetime, timedelta

# Set test environment before importing app modules
os.environ["AI_SERVICE_TYPE"] = "local"
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["SECRET_KEY"] = "test_secret_key_for_testing_only"

from app.routers.auth import (
    verify_password, 
    get_password_hash, 
    create_access_token
)
from app.core.config import settings

class TestPasswordHandling:
    def test_password_hashing(self):
        """Test password hashing and verification"""
        password = "testpassword123"
        hashed = get_password_hash(password)
        
        # Should not be the same as original
        assert hashed != password
        # Should verify correctly
        assert verify_password(password, hashed)
        # Should not verify wrong password
        assert not verify_password("wrongpassword", hashed)

    def test_password_hash_uniqueness(self):
        """Test that same password generates different hashes"""
        password = "testpassword123"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)
        
        # Different hashes due to salt
        assert hash1 != hash2
        # Both should verify
        assert verify_password(password, hash1)
        assert verify_password(password, hash2)

class TestTokenHandling:
    def test_create_access_token(self):
        """Test JWT token creation"""
        user_id = 123
        token = create_access_token(data={"sub": str(user_id)})
        
        # Should be a string
        assert isinstance(token, str)
        # Should decode correctly
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        assert payload["sub"] == str(user_id)

    def test_token_expiration(self):
        """Test token expiration setting"""
        user_id = 123
        expires_delta = timedelta(minutes=30)
        
        token = create_access_token(
            data={"sub": str(user_id)}, 
            expires_delta=expires_delta
        )
        
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        exp_timestamp = payload["exp"]
        
        # Handle both timestamp and datetime objects
        if isinstance(exp_timestamp, (int, float)):
            exp_datetime = datetime.utcfromtimestamp(exp_timestamp)
        else:
            exp_datetime = exp_timestamp
        
        # Check that token expires in the future
        current_time = datetime.utcnow()
        assert exp_datetime > current_time, "Token should expire in the future"
        
        # Check that expiration is roughly 30 minutes from now (allow 2 minutes tolerance)
        expected_expiration = current_time + expires_delta
        time_diff = abs((exp_datetime - expected_expiration).total_seconds())
        assert time_diff < 120, f"Token expiration time difference too large: {time_diff} seconds"
