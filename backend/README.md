# VerbatimAI - Backend

This is the backend API for the VerbatimAI project, built with FastAPI, SQLAlchemy, and PostgreSQL.

## Features

- User authentication and registration
- Feedback management (create, read, update, delete)
- CSV upload and parsing
- AI-powered sentiment analysis
- Topic extraction from feedback text
- Analytics for dashboard visualizations

## Tech Stack

- **FastAPI**: API framework
- **SQLAlchemy**: ORM for database operations
- **Pydantic**: Data validation and settings management
- **Alembic**: Database migrations
- **PostgreSQL**: Database
- **JWT**: Authentication
- **Python 3.9+**: Language runtime

## Project Structure

```
backend/
├── alembic/              # Database migrations
│   └── versions/         # Migration scripts
├── app/                  # Application package
│   ├── core/             # Core functionality
│   │   └── config.py     # Configuration settings
│   ├── db/               # Database connection and utilities
│   ├── models/           # SQLAlchemy models
│   ├── routers/          # API routes
│   ├── schemas/          # Pydantic schemas
│   ├── services/         # Business logic services
│   └── main.py           # Application entry point
├── tests/                # Test suite
├── .env.example          # Example environment variables
├── alembic.ini           # Alembic configuration
├── requirements.txt      # Python dependencies
└── run.py                # Script to run the server
```

## Getting Started

### Prerequisites

- Python 3.9+
- PostgreSQL

### Installation

1. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows, use: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

4. Edit the `.env` file to set up your database connection and API keys.

5. Initialize the database:

```bash
alembic upgrade head
```

6. Run the server:

```bash
python run.py
```

The API will be available at http://localhost:8000.

## API Documentation

Once the server is running, you can access the auto-generated API documentation at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Database Migrations

To create a new migration after changing models:

```bash
alembic revision --autogenerate -m "Description of changes"
```

To apply migrations:

```bash
alembic upgrade head
```

## Environment Variables

The following environment variables are used:

- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: Secret key for JWT token generation
- `ACCESS_TOKEN_EXPIRE_MINUTES`: JWT token expiration time
- `AI_SERVICE_TYPE`: AI service to use (claude, openai, local)
- `AI_API_KEY`: API key for AI service
- `AI_MODEL_NAME`: Model name for AI service

## Testing

### Quick Setup

First-time setup (only needed once):

```bash
# Create and setup virtual environment with all dependencies
./setup_venv.sh

# Activate the virtual environment
source venv/bin/activate
```

### Running Tests

#### Simple Test Commands (Daily Use)

```bash
# Quick test shortcuts
./test.sh                    # Show available commands
./test.sh unit               # Run unit tests only
./test.sh integration        # Run integration tests only
./test.sh run                # Run all tests with coverage
./test.sh coverage           # Run with detailed HTML coverage report
./test.sh quick              # Fast test run with minimal output
./test.sh clean              # Clean test artifacts
```

#### Advanced Test Commands

```bash
# Smart test runner with validation
./test_smart.sh info         # Show project and environment info
./test_smart.sh unit         # Unit tests with environment validation
./test_smart.sh coverage     # Comprehensive coverage analysis
./test_smart.sh clean        # Clean test artifacts
```

#### Comprehensive Test Suite

```bash
# Full test suite with detailed reporting (ideal for CI/CD)
./run_all_tests.sh
```

### Test Structure

```
tests/
├── unit/                    # Unit tests
│   ├── services/           # Service layer tests
│   ├── routers/            # API endpoint tests
│   └── models/             # Model tests
├── integration/            # Integration tests
│   ├── test_auth_api.py    # Authentication integration
│   └── test_feedback_api.py # Feedback API integration
└── test_basic.py           # Basic functionality tests
```

### Test Configuration

- **Coverage Threshold**: 70% minimum
- **Test Database**: Uses PostgreSQL for integration tests (matches production)
- **AI Service**: Uses local fallback during tests
- **Environment**: Isolated test environment with proper fixtures

### Integration Test Setup

For integration tests that use PostgreSQL:

```bash
# Setup test database (first time only)
python setup_test_db.py

# Or manually create the test database
createdb test_verbatimai
```

### Coverage Reports

After running tests with coverage:

```bash
# View HTML coverage report
open htmlcov/index.html

# Coverage files generated:
# - htmlcov/index.html (detailed HTML report)
# - coverage.xml (XML report for CI/CD)
# - Terminal output (summary)
```

### Troubleshooting Tests

#### Virtual Environment Issues
```bash
# If virtual environment is not activated
source venv/bin/activate

# If pytest is missing
pip install pytest pytest-cov

# Recreate virtual environment
./setup_venv.sh
```

#### Database Issues
```bash
# Ensure PostgreSQL is running
brew services start postgresql  # macOS
sudo systemctl start postgresql # Linux

# Recreate test database
dropdb test_verbatimai
createdb test_verbatimai
```

#### Path Issues
All test scripts now use dynamic path detection and work from any location:

```bash
# These work from anywhere in the project
/path/to/verbatimai/backend/test.sh unit
cd /tmp && /path/to/verbatimai/backend/test_smart.sh coverage
```

## AI Service Integration

The backend supports multiple AI services for sentiment analysis and topic extraction:

1. **Claude API**: Anthropic's Claude API
2. **OpenAI API**: OpenAI's API
3. **Local**: Simple rule-based fallback

To configure which service to use, set the `AI_SERVICE_TYPE` environment variable in your `.env` file.