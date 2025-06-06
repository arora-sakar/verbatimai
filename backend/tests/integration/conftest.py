import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# Use PostgreSQL for integration tests to match production environment
# This ensures tests run against the same database type as production
os.environ["AI_SERVICE_TYPE"] = "local"
os.environ["SECRET_KEY"] = "test_secret_key_for_testing_only"
os.environ["FREE_TIER_FEEDBACK_LIMIT"] = "10"

# PostgreSQL test database configuration
# Format: postgresql://username:password@host:port/database_name
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql://localhost:5432/test_verbatimai"
)

# Override the main database URL for tests
os.environ["DATABASE_URL"] = TEST_DATABASE_URL

from app.main import app
from app.db.database import get_db, Base
from app.models.models import User, FeedbackItem

# Create test database engine
engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def test_db():
    """Create test database tables"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session(test_db):
    """Create a fresh database session for each test"""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db_session):
    """Create test client with database dependency override"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()

@pytest.fixture
def test_user(db_session):
    """Create a test user"""
    from app.routers.auth import get_password_hash
    
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("TestPassword123"),
        business_name="Test Business"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def auth_headers(client, test_user):
    """Get authentication headers for test user"""
    response = client.post(
        "/api/auth/login/json",
        json={"email": "test@example.com", "password": "TestPassword123"}
    )
    token = response.json()["token"]
    return {"Authorization": f"Bearer {token}"}
