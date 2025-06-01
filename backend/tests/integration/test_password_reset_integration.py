import pytest
from fastapi.testclient import TestClient

class TestPasswordResetIntegrationAPI:
    """Integration tests for password reset API endpoints using existing test setup"""

    def test_request_password_reset_existing_user(self, client, test_user):
        """Test password reset request for existing user"""
        response = client.post(
            "/api/auth/request-password-reset",
            json={"email": test_user.email}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "reset instructions" in data["message"].lower()
        
        # Should return the same message regardless of user existence for security
        expected_message = "If an account with that email exists, we've sent password reset instructions."
        assert data["message"] == expected_message

    def test_request_password_reset_nonexistent_user(self, client):
        """Test password reset request for non-existent user (should return same message)"""
        response = client.post(
            "/api/auth/request-password-reset",
            json={"email": "nonexistent@example.com"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        
        # Should return the same message for security (no email enumeration)
        expected_message = "If an account with that email exists, we've sent password reset instructions."
        assert data["message"] == expected_message

    def test_request_password_reset_invalid_email_format(self, client):
        """Test password reset request with invalid email format"""
        response = client.post(
            "/api/auth/request-password-reset",
            json={"email": "invalid-email-format"}
        )
        
        assert response.status_code == 422  # Validation error
        data = response.json()
        assert "detail" in data

    def test_request_password_reset_missing_email(self, client):
        """Test password reset request with missing email field"""
        response = client.post(
            "/api/auth/request-password-reset",
            json={}
        )
        
        assert response.status_code == 422  # Validation error
        data = response.json()
        assert "detail" in data

    def test_create_and_verify_password_reset_token(self, test_user):
        """Test token creation and verification (helper functions)"""
        from app.routers.auth import create_password_reset_token, verify_password_reset_token
        
        # Create token
        token = create_password_reset_token(test_user.email)
        assert isinstance(token, str)
        assert len(token) > 20  # JWT tokens are long
        
        # Verify token
        verified_email = verify_password_reset_token(token)
        assert verified_email == test_user.email

    def test_verify_invalid_password_reset_token(self):
        """Test verification of invalid tokens"""
        from app.routers.auth import verify_password_reset_token
        
        # Test various invalid tokens
        assert verify_password_reset_token("invalid_token") is None
        assert verify_password_reset_token("") is None
        assert verify_password_reset_token(None) is None

    def test_reset_password_with_valid_token(self, client, test_user):
        """Test complete password reset flow with valid token"""
        from app.routers.auth import create_password_reset_token
        
        # Create a valid reset token
        token = create_password_reset_token(test_user.email)
        
        # Reset password
        new_password = "NewPassword123"
        response = client.post(
            "/api/auth/reset-password",
            json={
                "token": token,
                "new_password": new_password
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "successfully" in data["message"].lower()
        
        # Verify password was actually changed by trying to login
        login_response = client.post(
            "/api/auth/login/json",
            json={
                "email": test_user.email,
                "password": new_password
            }
        )
        
        assert login_response.status_code == 200
        login_data = login_response.json()
        assert "user" in login_data
        assert "token" in login_data
        assert login_data["user"]["email"] == test_user.email

    def test_reset_password_with_invalid_token(self, client):
        """Test password reset with invalid token"""
        response = client.post(
            "/api/auth/reset-password",
            json={
                "token": "invalid_token",
                "new_password": "NewPassword123"
            }
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "invalid" in data["detail"].lower()

    def test_reset_password_with_expired_token(self, client, test_user):
        """Test password reset with expired token"""
        from datetime import datetime, timedelta
        from jose import jwt
        from app.core.config import settings
        
        # Create an expired token manually
        expired_payload = {
            "email": test_user.email,
            "type": "password_reset",
            "exp": datetime.utcnow() - timedelta(hours=1)  # Expired 1 hour ago
        }
        expired_token = jwt.encode(expired_payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        
        response = client.post(
            "/api/auth/reset-password",
            json={
                "token": expired_token,
                "new_password": "NewPassword123"
            }
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "invalid" in data["detail"].lower() or "expired" in data["detail"].lower()

    def test_reset_password_wrong_token_type(self, client, test_user):
        """Test password reset with wrong token type (e.g., access token)"""
        from app.routers.auth import create_access_token
        
        # Create an access token instead of password reset token
        access_token = create_access_token(data={"sub": str(test_user.id)})
        
        response = client.post(
            "/api/auth/reset-password",
            json={
                "token": access_token,
                "new_password": "NewPassword123"
            }
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "invalid" in data["detail"].lower()

    def test_reset_password_weak_password(self, client, test_user):
        """Test password reset with weak password"""
        from app.routers.auth import create_password_reset_token
        
        token = create_password_reset_token(test_user.email)
        
        response = client.post(
            "/api/auth/reset-password",
            json={
                "token": token,
                "new_password": "weak"  # Too short
            }
        )
        
        assert response.status_code == 422  # Validation error
        data = response.json()
        assert "detail" in data

    def test_reset_password_missing_fields(self, client):
        """Test password reset with missing required fields"""
        # Missing token
        response = client.post(
            "/api/auth/reset-password",
            json={"new_password": "NewPassword123"}
        )
        assert response.status_code == 422
        
        # Missing new_password
        response = client.post(
            "/api/auth/reset-password",
            json={"token": "some_token"}
        )
        assert response.status_code == 422


class TestPasswordResetEndToEndFlow:
    """End-to-end integration tests for the complete password reset flow"""

    def test_complete_password_reset_flow(self, client, db_session):
        """Test the complete flow from request to successful password change"""
        from app.routers.auth import get_password_hash, create_password_reset_token
        from app.models.models import User
        
        # Create a fresh user for this test
        fresh_user = User(
            email="fresh@example.com",
            hashed_password=get_password_hash("OriginalPassword123"),
            business_name="Fresh Business"
        )
        db_session.add(fresh_user)
        db_session.commit()
        db_session.refresh(fresh_user)
        
        original_password = "OriginalPassword123"
        new_password = "NewPassword456"
        
        # Step 1: Request password reset
        reset_request_response = client.post(
            "/api/auth/request-password-reset",
            json={"email": fresh_user.email}
        )
        
        assert reset_request_response.status_code == 200
        
        # Step 2: Create token (simulating email link click)
        token = create_password_reset_token(fresh_user.email)
        
        # Step 3: Reset password
        reset_response = client.post(
            "/api/auth/reset-password",
            json={
                "token": token,
                "new_password": new_password
            }
        )
        
        assert reset_response.status_code == 200
        reset_data = reset_response.json()
        assert "successfully" in reset_data["message"].lower()
        
        # Step 4: Verify old password no longer works
        old_login_response = client.post(
            "/api/auth/login/json",
            json={
                "email": fresh_user.email,
                "password": original_password
            }
        )
        
        assert old_login_response.status_code == 401
        
        # Step 5: Verify new password works
        new_login_response = client.post(
            "/api/auth/login/json",
            json={
                "email": fresh_user.email,
                "password": new_password
            }
        )
        
        assert new_login_response.status_code == 200
        login_data = new_login_response.json()
        assert "user" in login_data
        assert "token" in login_data
        assert login_data["user"]["email"] == fresh_user.email

    def test_multiple_reset_requests(self, client, test_user):
        """Test multiple password reset requests for the same user"""
        # Multiple reset requests should all return success
        for i in range(3):
            response = client.post(
                "/api/auth/request-password-reset",
                json={"email": test_user.email}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "reset instructions" in data["message"].lower()


class TestPasswordResetSecurityValidation:
    """Security-focused integration tests"""

    def test_email_enumeration_prevention(self, client, test_user):
        """Test that responses don't reveal whether email exists"""
        # Request for existing user
        response1 = client.post(
            "/api/auth/request-password-reset",
            json={"email": test_user.email}
        )
        
        # Request for non-existing user
        response2 = client.post(
            "/api/auth/request-password-reset",
            json={"email": "nonexistent@example.com"}
        )
        
        # Both should return same status code and message
        assert response1.status_code == response2.status_code == 200
        assert response1.json()["message"] == response2.json()["message"]

    def test_password_strength_enforcement(self, client, test_user):
        """Test that password strength is enforced at API level"""
        from app.routers.auth import create_password_reset_token
        
        token = create_password_reset_token(test_user.email)
        
        weak_passwords = [
            "weak",          # Too short
            "weakpass",      # No uppercase, no numbers
            "WEAKPASS",      # No lowercase, no numbers
            "12345678",      # No letters
            "WeakPass",      # No numbers
            "weakpass1",     # No uppercase
            "WEAKPASS1",     # No lowercase
        ]
        
        for weak_password in weak_passwords:
            response = client.post(
                "/api/auth/reset-password",
                json={
                    "token": token,
                    "new_password": weak_password
                }
            )
            
            # Should reject weak passwords
            assert response.status_code == 422, f"Weak password '{weak_password}' was not rejected (got {response.status_code})"
            
        # Test a strong password that should work
        strong_response = client.post(
            "/api/auth/reset-password",
            json={
                "token": token,
                "new_password": "StrongPass123"
            }
        )
        assert strong_response.status_code == 200, "Strong password should be accepted"

    def test_user_deleted_scenario(self, client, db_session):
        """Test password reset when user is deleted after token creation but before reset"""
        from app.routers.auth import get_password_hash, create_password_reset_token
        from app.models.models import User
        
        # Create a temporary user
        temp_user = User(
            email="temp@example.com",
            hashed_password=get_password_hash("temppassword"),
            business_name="Temp Business"
        )
        db_session.add(temp_user)
        db_session.commit()
        db_session.refresh(temp_user)
        
        # Create reset token
        token = create_password_reset_token(temp_user.email)
        
        # Delete the user
        db_session.delete(temp_user)
        db_session.commit()
        
        # Try to reset password
        response = client.post(
            "/api/auth/reset-password",
            json={
                "token": token,
                "new_password": "NewPassword123"
            }
        )
        
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert "user" in data["detail"].lower()
