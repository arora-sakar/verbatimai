from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from ..core.config import settings

# Debug: Print database URL being used
print(f"🔍 DEBUG: Using DATABASE_URL: {settings.DATABASE_URL[:50]}...")

# Create SQLAlchemy engine
engine = create_engine(
    settings.DATABASE_URL,
)

# Create SessionLocal class for database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for database models
Base = declarative_base()

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()