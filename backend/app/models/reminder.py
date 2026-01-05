from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timedelta
import enum
from app.models.base import BaseModel


class ReminderStatus(str, enum.Enum):
    """Enum for reminder status."""
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    FAILED = "failed"


class Reminder(BaseModel):
    """Reminder model for storing user reminders."""

    __tablename__ = "reminders"

    # Foreign key to User
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    # Reminder fields
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    phone_number: Mapped[str] = mapped_column(String(20), nullable=False)
    date_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    timezone: Mapped[str] = mapped_column(String(10), nullable=False)  # e.g., "UTC+1", "UTC-7"
    date_time_utc: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
        index=True
    )
    status: Mapped[str] = mapped_column(
        String(20),
        default=ReminderStatus.SCHEDULED.value,
        nullable=False
    )

    # Relationship
    user: Mapped["User"] = relationship("User", back_populates="reminders")

    def set_utc_datetime(self, local_dt: datetime, tz_offset: str) -> None:
        """
        Convert local datetime to UTC and store in date_time_utc.

        Args:
            local_dt: datetime in user's local timezone (naive)
            tz_offset: string like "UTC-5" or "UTC+1"
        """
        # Parse offset: "UTC-5" -> -5 hours
        offset_hours = int(tz_offset.replace("UTC", ""))
        # Convert to UTC by subtracting the offset
        self.date_time_utc = local_dt - timedelta(hours=offset_hours)

    def __repr__(self) -> str:
        return f"<Reminder(id={self.id}, title='{self.title}', status='{self.status}')>"
