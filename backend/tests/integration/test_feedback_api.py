import pytest
from io import StringIO, BytesIO

class TestFeedbackCreation:
    def test_create_feedback(self, client, auth_headers):
        """Test creating a single feedback item"""
        feedback_data = {
            "feedback_text": "Great product, very satisfied!",
            "source": "Manual Entry",
            "rating": 5
        }
        
        response = client.post(
            "/api/feedback/", 
            json=feedback_data, 
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["feedback_text"] == feedback_data["feedback_text"]
        assert data["sentiment"] is not None  # Should be analyzed
        assert data["topics"] is not None

    def test_create_feedback_unauthorized(self, client):
        """Test creating feedback without authentication"""
        feedback_data = {
            "feedback_text": "Test feedback",
            "source": "Manual Entry"
        }
        
        response = client.post("/api/feedback/", json=feedback_data)
        
        assert response.status_code == 401

class TestFeedbackRetrieval:
    def test_get_feedback_list(self, client, auth_headers, test_user, db_session):
        """Test retrieving feedback list"""
        # Create test feedback
        from app.models.models import FeedbackItem
        feedback = FeedbackItem(
            feedback_text="Test feedback",
            source="Manual Entry",
            sentiment="positive",
            topics=["test"],
            owner_id=test_user.id
        )
        db_session.add(feedback)
        db_session.commit()
        
        response = client.get("/api/feedback/", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert data[0]["feedback_text"] == "Test feedback"

    def test_get_feedback_with_pagination(self, client, auth_headers):
        """Test feedback pagination"""
        response = client.get(
            "/api/feedback/?skip=0&limit=5", 
            headers=auth_headers
        )
        
        assert response.status_code == 200
        # Should include total count header
        assert "X-Total-Count" in response.headers

    def test_get_feedback_with_filters(self, client, auth_headers, test_user, db_session):
        """Test feedback filtering"""
        # Create test feedback with different sentiments
        from app.models.models import FeedbackItem
        feedback1 = FeedbackItem(
            feedback_text="Positive feedback",
            source="Manual Entry",
            sentiment="positive",
            owner_id=test_user.id
        )
        feedback2 = FeedbackItem(
            feedback_text="Negative feedback",
            source="Manual Entry",
            sentiment="negative",
            owner_id=test_user.id
        )
        db_session.add_all([feedback1, feedback2])
        db_session.commit()
        
        # Test sentiment filter
        response = client.get(
            "/api/feedback/?sentiment=positive", 
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert all(item["sentiment"] == "positive" for item in data)

class TestCSVUpload:
    def test_upload_valid_csv(self, client, auth_headers):
        """Test uploading a valid CSV file"""
        csv_content = """feedback_text,source,rating
"Great product!",Email,5
"Could be better",Survey,3
"Terrible experience",Phone,1"""
        
        csv_bytes = csv_content.encode('utf-8')
        csv_file = BytesIO(csv_bytes)
        csv_file.name = "test.csv"
        
        response = client.post(
            "/api/feedback/upload-csv",
            headers=auth_headers,
            files={"file": ("test.csv", csv_file, "text/csv")}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "success"
        assert data["created"] == 3
        assert data["failed"] == 0

    def test_upload_invalid_csv(self, client, auth_headers):
        """Test uploading CSV without required column"""
        csv_content = """text,source
"Some feedback",Email"""
        
        csv_bytes = csv_content.encode('utf-8')
        csv_file = BytesIO(csv_bytes)
        csv_file.name = "test.csv"
        
        response = client.post(
            "/api/feedback/upload-csv",
            headers=auth_headers,
            files={"file": ("test.csv", csv_file, "text/csv")}
        )
        
        assert response.status_code == 400
        assert "feedback_text" in response.json()["detail"]

    def test_upload_csv_unauthorized(self, client):
        """Test uploading CSV without authentication"""
        csv_content = "feedback_text\nTest feedback"
        csv_bytes = csv_content.encode('utf-8')
        csv_file = BytesIO(csv_bytes)
        csv_file.name = "test.csv"
        
        response = client.post(
            "/api/feedback/upload-csv",
            files={"file": ("test.csv", csv_file, "text/csv")}
        )
        
        assert response.status_code == 401
