import pytest
import os
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, AsyncMock
from jose import jwt

# Set test environment before importing app modules
os.environ["AI_SERVICE_TYPE"] = "local"
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["SECRET_KEY"] = "test_secret_key_for_testing_only"

from app.models.models import User
from app.core.config import settings


class TestPasswordResetTokenGeneration:
    """Test password reset token creation and validation"""
    
    def test_create_password_reset_token(self):
        """Test creating a password reset token with user email"""
        from app.routers.auth import create_password_reset_token
        
        email = "test@example.com"
        token = create_password_reset_token(email)
        
        # Should return a valid string token
        assert isinstance(token, str)
        assert len(token) > 20  # JWT tokens are long strings
        
        # Should be decodable with correct email
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        assert payload["email"] == email
        assert payload["type"] == "password_reset"
    
    def test_password_reset_token_expiration(self):
        """Test that password reset tokens have proper expiration"""
        from app.routers.auth import create_password_reset_token
        
        email = "test@example.com"
        token = create_password_reset_token(email)
        
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        exp_timestamp = payload["exp"]
        
        # Convert timestamp to datetime for comparison
        if isinstance(exp_timestamp, (int, float)):
            exp_datetime = datetime.utcfromtimestamp(exp_timestamp)
        else:
            exp_datetime = exp_timestamp
        
        # Should expire in the future (within 1 hour by default)
        current_time = datetime.utcnow()
        expected_expiration = current_time + timedelta(hours=1)
        
        assert exp_datetime > current_time
        # Should be approximately 1 hour from now (allow 5 minutes tolerance)
        time_diff = abs((exp_datetime - expected_expiration).total_seconds())
        assert time_diff < 300, f"Token expiration time difference too large: {time_diff} seconds"
    
    def test_verify_password_reset_token(self):
        """Test verifying and extracting email from password reset token"""
        from app.routers.auth import create_password_reset_token, verify_password_reset_token
        
        email = "test@example.com"
        token = create_password_reset_token(email)
        
        # Should successfully verify and return email
        verified_email = verify_password_reset_token(token)
        assert verified_email == email
    
    def test_verify_invalid_password_reset_token(self):
        """Test that invalid tokens are rejected"""
        from app.routers.auth import verify_password_reset_token
        
        # Invalid token should return None
        assert verify_password_reset_token("invalid_token") is None
        assert verify_password_reset_token("") is None
        assert verify_password_reset_token(None) is None
    
    def test_verify_expired_password_reset_token(self):
        """Test that expired tokens are rejected"""
        from app.routers.auth import verify_password_reset_token
        
        # Create an expired token
        email = "test@example.com"
        expired_payload = {
            "email": email,
            "type": "password_reset",
            "exp": datetime.utcnow() - timedelta(hours=1)  # Expired 1 hour ago
        }
        expired_token = jwt.encode(expired_payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        
        # Should return None for expired token
        assert verify_password_reset_token(expired_token) is None
    
    def test_verify_wrong_token_type(self):
        """Test that non-password-reset tokens are rejected"""
        from app.routers.auth import verify_password_reset_token, create_access_token
        
        # Create a regular access token
        access_token = create_access_token(data={"sub": "123"})
        
        # Should return None for wrong token type
        assert verify_password_reset_token(access_token) is None


class TestPasswordResetEmailService:
    """Test email template and sending functionality"""
    
    def test_password_reset_email_template(self):
        """Test password reset email template generation"""
        from app.routers.auth import generate_password_reset_email_template
        
        email = "test@example.com"
        token = "sample_reset_token"
        
        html_content = generate_password_reset_email_template(email, token)
        
        # Should contain required elements
        assert "Password Reset Request" in html_content
        assert email in html_content
        assert token in html_content
        assert "reset your password" in html_content.lower()
        assert "click" in html_content.lower()
        
        # Should be valid HTML
        assert "<html>" in html_content or "<!DOCTYPE" in html_content
        assert "</html>" in html_content
    
    @patch('app.routers.auth.send_email_service')
    def test_send_password_reset_email_success(self, mock_send_email):
        """Test successful password reset email sending"""
        from app.routers.auth import send_password_reset_email
        
        email = "test@example.com"
        token = "sample_reset_token"
        
        # Mock successful email sending
        mock_send_email.return_value = True
        
        result = send_password_reset_email(email, token)
        
        # Should call email service and return True
        mock_send_email.assert_called_once()
        assert result is True
        
        # Check that email service was called with correct parameters
        call_args = mock_send_email.call_args
        assert call_args.kwargs["to_email"] == email
        assert call_args.kwargs["subject"] == "Password Reset Request"
        assert token in call_args.kwargs["html_content"]
    
    @patch('app.routers.auth.send_email_service')
    def test_send_password_reset_email_failure(self, mock_send_email):
        """Test handling email sending failure"""
        from app.routers.auth import send_password_reset_email
        
        email = "test@example.com"
        token = "sample_reset_token"
        
        # Mock email sending failure
        mock_send_email.side_effect = Exception("SMTP server error")
        
        result = send_password_reset_email(email, token)
        
        # Should handle error gracefully and return False
        assert result is False


class TestPasswordResetEndpoints:
    """Test password reset API endpoints"""
    
    @pytest.fixture
    def mock_db_session(self):
        """Mock database session for testing"""
        return Mock()
    
    @pytest.fixture
    def sample_user(self):
        """Sample user for testing"""
        user = Mock(spec=User)
        user.id = 1
        user.email = "test@example.com"
        user.business_name = "Test Business"
        user.hashed_password = "hashed_password_123"
        user.is_active = True
        return user
    
    @patch('app.routers.auth.send_password_reset_email')
    def test_request_password_reset_success(self, mock_send_email, mock_db_session, sample_user):
        """Test successful password reset request"""
        from app.routers.auth import request_password_reset
        from app.schemas.schemas import PasswordResetRequest
        
        # Setup mocks
        mock_db_session.query.return_value.filter.return_value.first.return_value = sample_user
        mock_send_email.return_value = True
        
        request_data = PasswordResetRequest(email="test@example.com")
        
        response = request_password_reset(request_data, mock_db_session)
        
        # Should return success message
        assert "message" in response
        assert "reset instructions" in response["message"].lower()
        
        # Should have called email service
        mock_send_email.assert_called_once()
    
    @patch('app.routers.auth.send_password_reset_email')
    def test_request_password_reset_user_not_found(self, mock_send_email, mock_db_session):
        """Test password reset request for non-existent user"""
        from app.routers.auth import request_password_reset
        from app.schemas.schemas import PasswordResetRequest
        
        # Setup mocks - user not found
        mock_db_session.query.return_value.filter.return_value.first.return_value = None
        
        request_data = PasswordResetRequest(email="nonexistent@example.com")
        
        response = request_password_reset(request_data, mock_db_session)
        
        # Should still return success message for security (don't reveal if email exists)
        assert "message" in response
        assert "reset instructions" in response["message"].lower()
        
        # Should not have called email service
        mock_send_email.assert_not_called()
    
    def test_reset_password_success(self, mock_db_session, sample_user):
        """Test successful password reset with valid token"""
        from app.routers.auth import reset_password, create_password_reset_token
        from app.schemas.schemas import PasswordReset
        
        # Setup mocks
        mock_db_session.query.return_value.filter.return_value.first.return_value = sample_user
        mock_db_session.commit = Mock()
        
        # Create valid reset token
        token = create_password_reset_token(sample_user.email)
        reset_data = PasswordReset(token=token, new_password="NewPassword123")
        
        response = reset_password(reset_data, mock_db_session)
        
        # Should return success message
        assert "message" in response
        assert "successfully" in response["message"].lower()
        
        # Should have updated user password
        mock_db_session.commit.assert_called_once()
    
    def test_reset_password_invalid_token(self, mock_db_session):
        """Test password reset with invalid token"""
        from app.routers.auth import reset_password
        from app.schemas.schemas import PasswordReset
        from fastapi import HTTPException
        
        reset_data = PasswordReset(token="invalid_token", new_password="NewPassword123")
        
        # Should raise HTTP exception for invalid token
        with pytest.raises(HTTPException) as exc_info:
            reset_password(reset_data, mock_db_session)
        
        assert exc_info.value.status_code == 400
        assert "invalid" in exc_info.value.detail.lower()


class TestPasswordResetValidation:
    """Test password reset input validation and edge cases"""
    
    def test_password_reset_request_email_validation(self):
        """Test email validation in password reset request"""
        from app.schemas.schemas import PasswordResetRequest
        from pydantic import ValidationError
        
        # Valid email should work
        valid_request = PasswordResetRequest(email="valid@example.com")
        assert valid_request.email == "valid@example.com"
        
        # Invalid emails should raise validation error
        with pytest.raises(ValidationError):
            PasswordResetRequest(email="invalid-email")
        
        with pytest.raises(ValidationError):
            PasswordResetRequest(email="")
        
        with pytest.raises(ValidationError):
            PasswordResetRequest(email="@example.com")
    
    def test_password_reset_new_password_validation(self):
        """Test new password validation in reset request"""
        from app.schemas.schemas import PasswordReset
        from pydantic import ValidationError
        
        valid_token = "valid_token_placeholder"
        
        # Valid password should work
        valid_reset = PasswordReset(token=valid_token, new_password="ValidPassword123")
        assert valid_reset.new_password == "ValidPassword123"
        
        # Short password should raise validation error
        with pytest.raises(ValidationError):
            PasswordReset(token=valid_token, new_password="short")
        
        # Empty password should raise validation error
        with pytest.raises(ValidationError):
            PasswordReset(token=valid_token, new_password="")


class TestPasswordResetIntegration:
    """Integration tests for complete password reset flow"""
    
    @patch('app.routers.auth.send_password_reset_email')
    def test_complete_password_reset_flow(self, mock_send_email):
        """Test complete password reset flow from request to completion"""
        from app.routers.auth import (
            request_password_reset, 
            reset_password, 
            create_password_reset_token
        )
        from app.schemas.schemas import PasswordResetRequest, PasswordReset
        
        # Mock successful email sending
        mock_send_email.return_value = True
        
        # Create mock user and database
        mock_db = Mock()
        mock_user = Mock(spec=User)
        mock_user.email = "integration@example.com"
        mock_user.hashed_password = "original_hashed_password"
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user
        
        # Step 1: Request password reset
        reset_request = PasswordResetRequest(email="integration@example.com")
        response1 = request_password_reset(reset_request, mock_db)
        
        assert "message" in response1
        mock_send_email.assert_called_once()
        
        # Step 2: Reset password with token
        token = create_password_reset_token("integration@example.com")
        new_password = "NewPassword123"
        reset_data = PasswordReset(token=token, new_password=new_password)
        
        response2 = reset_password(reset_data, mock_db)
        
        assert "message" in response2
        assert "successfully" in response2["message"].lower()
        mock_db.commit.assert_called_once()
