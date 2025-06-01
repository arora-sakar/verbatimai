import pytest
import os

# Set test environment variables before importing the app
os.environ["AI_SERVICE_TYPE"] = "local"
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["SECRET_KEY"] = "test_secret_key_for_testing_only"
os.environ["FREE_TIER_FEEDBACK_LIMIT"] = "10"

# Basic conftest - no complex fixtures yet, just environment setup
