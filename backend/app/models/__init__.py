# Import all models here for Alembic auto-detection
from app.models.base import BaseModel
from app.models.user import User
from app.models.reminder import Reminder, ReminderStatus

__all__ = ["BaseModel", "User", "Reminder", "ReminderStatus"]
