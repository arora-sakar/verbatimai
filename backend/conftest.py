import pytest
import os

# Set test environment variables before importing the app
os.environ["AI_SERVICE_TYPE"] = "local"
os.environ["SECRET_KEY"] = "test_secret_key_for_testing_only"
os.environ["FREE_TIER_FEEDBACK_LIMIT"] = "10"

# For integration tests, use PostgreSQL to match production
# For unit tests, this will be overridden as needed
if "TEST_DATABASE_URL" not in os.environ:
    os.environ["DATABASE_URL"] = os.getenv(
        "TEST_DATABASE_URL", 
        "postgresql://localhost:5432/test_verbatimai"
    )
