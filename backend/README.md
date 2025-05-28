# SMB Feedback Insights - Backend

This is the backend API for the SMB Feedback Insights project, built with FastAPI, SQLAlchemy, and PostgreSQL.

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

Run tests with pytest:

```bash
pytest
```

## AI Service Integration

The backend supports multiple AI services for sentiment analysis and topic extraction:

1. **Claude API**: Anthropic's Claude API
2. **OpenAI API**: OpenAI's API
3. **Local**: Simple rule-based fallback

To configure which service to use, set the `AI_SERVICE_TYPE` environment variable in your `.env` file.