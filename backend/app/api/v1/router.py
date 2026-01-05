from fastapi import APIRouter
from app.api.v1 import users

# Create the main API router for v1
api_router = APIRouter()

# Include sub-routers
api_router.include_router(users.router)


@api_router.get("/")
def api_root():
    """API v1 root endpoint."""
    return {"message": "Call Me Reminder API v1"}
