from datetime import datetime
from pydantic import BaseModel, Field
from typing import Literal


class ReminderCreate(BaseModel):
    """Schema for creating a reminder."""
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1)
    phone_number: str = Field(..., pattern=r'^\+\d{10,15}$')
    date_time: datetime
    timezone: str = Field(..., pattern=r'^UTC[+-]\d{1,2}$')  # e.g., UTC+1, UTC-7


class ReminderUpdate(BaseModel):
    """Schema for updating a reminder."""
    title: str | None = Field(None, min_length=1, max_length=200)
    message: str | None = Field(None, min_length=1)
    phone_number: str | None = Field(None, pattern=r'^\+\d{10,15}$')
    date_time: datetime | None = None
    timezone: str | None = Field(None, pattern=r'^UTC[+-]\d{1,2}$')
    status: Literal["scheduled", "completed", "failed"] | None = None


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
