import pytest
from fastapi.testclient import TestClient

class TestUserRegistration:
    def test_register_new_user(self, client):
        """Test successful user registration"""
        user_data = {
            "email": "newuser@example.com",
            "password": "securepassword123",
            "business_name": "New Business"
        }
        
        response = client.post("/api/auth/register", json=user_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == user_data["email"]
        assert data["business_name"] == user_data["business_name"]
        assert "hashed_password" not in data  # Should not expose password

    def test_register_duplicate_email(self, client, test_user):
        """Test registration with existing email"""
        user_data = {
            "email": "test@example.com",  # Same as test_user
            "password": "anotherpassword123",
            "business_name": "Another Business"
        }
        
        response = client.post("/api/auth/register", json=user_data)
        
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"]

    def test_register_invalid_email(self, client):
        """Test registration with invalid email"""
        user_data = {
            "email": "not-an-email",
            "password": "securepassword123",
            "business_name": "Test Business"
        }
        
        response = client.post("/api/auth/register", json=user_data)
        
        assert response.status_code == 422  # Validation error

class TestUserLogin:
    def test_login_success(self, client, test_user):
        """Test successful login"""
        login_data = {
            "email": "test@example.com",
            "password": "testpassword123"
        }
        
        response = client.post("/api/auth/login/json", json=login_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == "test@example.com"

    def test_login_wrong_password(self, client, test_user):
        """Test login with wrong password"""
        login_data = {
            "email": "test@example.com",
            "password": "wrongpassword"
        }
        
        response = client.post("/api/auth/login/json", json=login_data)
        
        assert response.status_code == 401
        assert "Incorrect email or password" in response.json()["detail"]

    def test_login_nonexistent_user(self, client):
        """Test login with non-existent user"""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "somepassword"
        }
        
        response = client.post("/api/auth/login/json", json=login_data)
        
        assert response.status_code == 401

class TestTokenVerification:
    def test_verify_valid_token(self, client, auth_headers):
        """Test token verification with valid token"""
        response = client.get("/api/auth/verify", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"

    def test_verify_invalid_token(self, client):
        """Test token verification with invalid token"""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/api/auth/verify", headers=headers)
        
        assert response.status_code == 401

    def test_verify_no_token(self, client):
        """Test token verification without token"""
        response = client.get("/api/auth/verify")
        
        assert response.status_code == 401
