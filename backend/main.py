from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.api.v1.router import api_router
from app.scheduler import start_scheduler, shutdown_scheduler
import app.jobs.daily_calls
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan events."""
    start_scheduler()
    yield
    shutdown_scheduler()


# Create database tables in development mode
# In production, use Alembic migrations instead
if settings.is_development:
    Base.metadata.create_all(bind=engine)

# Initialize FastAPI application with lifespan
app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    lifespan=lifespan
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
def read_root():
    return {"message": "Welcome to Call Me Reminder API"}


@app.get("/health")
def health_check():
    return {"status": "healthy", "environment": settings.ENVIRONMENT}