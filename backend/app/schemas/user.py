from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    """Schema for user signup."""
    email: EmailStr


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr


class UserResponse(BaseModel):
    """Schema for user response."""
    id: int
    email: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
