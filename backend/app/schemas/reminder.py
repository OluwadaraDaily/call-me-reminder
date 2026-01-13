from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from typing import Literal, List, Generic, TypeVar
from zoneinfo import ZoneInfo, available_timezones


class ReminderCreate(BaseModel):
    """Schema for creating a reminder."""
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1)
    phone_number: str = Field(..., pattern=r'^\+\d{10,15}$')
    date_time: datetime
    timezone: str = Field(..., min_length=1, max_length=100)  # IANA timezone identifier e.g., "America/New_York", "Asia/Kolkata"

    @field_validator('timezone')
    @classmethod
    def validate_timezone(cls, v: str) -> str:
        """Validate that the timezone is a valid IANA timezone identifier."""
        # Also support legacy UTC±X format for backward compatibility
        if v.startswith('UTC'):
            # Allow UTC, UTC+X, UTC-X formats (legacy support)
            return v

        if v not in available_timezones():
            raise ValueError(f"Invalid timezone identifier: {v}. Must be a valid IANA timezone (e.g., 'America/New_York', 'Asia/Kolkata')")
        return v


class ReminderUpdate(BaseModel):
    """Schema for updating a reminder."""
    title: str | None = Field(None, min_length=1, max_length=200)
    message: str | None = Field(None, min_length=1)
    phone_number: str | None = Field(None, pattern=r'^\+\d{10,15}$')
    date_time: datetime | None = None
    timezone: str | None = Field(None, min_length=1, max_length=100)
    status: Literal["scheduled", "completed", "failed"] | None = None

    @field_validator('timezone')
    @classmethod
    def validate_timezone(cls, v: str | None) -> str | None:
        """Validate that the timezone is a valid IANA timezone identifier."""
        if v is None:
            return v

        # Also support legacy UTC±X format for backward compatibility
        if v.startswith('UTC'):
            return v

        if v not in available_timezones():
            raise ValueError(f"Invalid timezone identifier: {v}. Must be a valid IANA timezone (e.g., 'America/New_York', 'Asia/Kolkata')")
        return v


class ReminderResponse(BaseModel):
    """Schema for reminder response."""
    id: int
    user_id: int
    title: str
    message: str
    phone_number: str
    date_time: datetime
    timezone: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ReminderStatsResponse(BaseModel):
    """Schema for reminder statistics."""
    total: int = Field(..., description="Total number of reminders")
    scheduled: int = Field(..., description="Number of scheduled reminders")
    completed: int = Field(..., description="Number of completed reminders")
    failed: int = Field(..., description="Number of failed reminders")


T = TypeVar('T')


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response schema."""
    items: List[T]
    total: int
    skip: int
    limit: int
