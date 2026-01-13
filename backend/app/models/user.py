from datetime import datetime
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel


class User(BaseModel):
    """User model for authentication."""

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)

    # Password authentication fields
    password_hash: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,  # Nullable for migration compatibility with existing users
        comment="Bcrypt hashed password"
    )

    # Password reset fields
    reset_token: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        index=True,
        comment="Secure token for password reset"
    )
    reset_token_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
        comment="Expiration datetime for reset token"
    )

    # Relationships
    reminders: Mapped[list["Reminder"]] = relationship(
        "Reminder",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        "RefreshToken",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}')>"
