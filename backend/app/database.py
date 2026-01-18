from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Session
from app.config import settings


# Build engine arguments based on database type
engine_args = {
    "echo": settings.DEBUG,  # Log SQL queries in debug mode
    "future": True  # Use SQLAlchemy 2.0 style
}

# SQLite requires check_same_thread=False, PostgreSQL doesn't support this argument
if settings.database_url.startswith("sqlite"):
    engine_args["connect_args"] = {"check_same_thread": False}

# Create SQLAlchemy engine
engine = create_engine(settings.database_url, **engine_args)

# Create SessionLocal class
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=Session,
    expire_on_commit=False
)


# SQLAlchemy 2.0 declarative base
class Base(DeclarativeBase):
    """Base class for all database models."""
    pass
