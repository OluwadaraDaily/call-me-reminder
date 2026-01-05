# Import all models here for Alembic auto-detection
from app.models.base import BaseModel
from app.models.user import User

__all__ = ["BaseModel", "User"]
