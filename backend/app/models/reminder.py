from sqlalchemy import String, Text, DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
import enum
import re
import uuid
from app.models.base import BaseModel


class ReminderStatus(str, enum.Enum):
    """Enum for reminder status."""
    SCHEDULED = "scheduled"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    PENDING_RETRY = "pending_retry"


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
    timezone: Mapped[str] = mapped_column(String(100), nullable=False)  # IANA timezone identifier e.g., "America/New_York"
    date_time_utc: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
        index=True
    )
    status: Mapped[str] = mapped_column(
        String(20),
        default=ReminderStatus.SCHEDULED.value,
        nullable=False,
        index=True
    )

    # Retry tracking fields
    attempt_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    max_attempts: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    next_retry_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, index=True)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Idempotency tracking
    idempotency_key: Mapped[str | None] = mapped_column(String(64), nullable=True, unique=True, index=True)
    vapi_call_id: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)

    def generate_idempotency_key(self) -> str:
        """Generate a unique idempotency key for this reminder attempt."""
        key = f"{self.id}-{self.attempt_count}-{uuid.uuid4().hex[:8]}"
        self.idempotency_key = key
        return key

    def calculate_next_retry(self, base_delay_seconds: int = 60) -> datetime:
        """Calculate next retry time using exponential backoff."""
        delay = base_delay_seconds * (2 ** self.attempt_count)
        self.next_retry_at = datetime.utcnow() + timedelta(seconds=delay)
        return self.next_retry_at

    # Relationship
    user: Mapped["User"] = relationship("User", back_populates="reminders")

    def set_utc_datetime(self, local_dt: datetime, tz_identifier: str) -> None:
        """
        Convert local datetime to UTC and store in date_time_utc.

        Args:
            local_dt: datetime in user's local timezone (naive)
            tz_identifier: IANA timezone identifier (e.g., "America/New_York", "Asia/Kolkata")
                          or legacy UTC offset format (e.g., "UTC-5", "UTC+5:30")
        """
        # Handle legacy UTC±X format for backward compatibility
        if tz_identifier.startswith('UTC'):
            offset_str = tz_identifier.replace('UTC', '')

            if not offset_str or offset_str == '+0' or offset_str == '-0':
                # UTC with no offset
                self.date_time_utc = local_dt
                return

            # Parse UTC±X or UTC±X:XX format
            match = re.match(r'^([+-])?(\d{1,2})(?::(\d{2}))?$', offset_str)
            if match:
                sign = -1 if match.group(1) == '-' else 1
                hours = int(match.group(2))
                minutes = int(match.group(3) or 0)
                total_minutes = sign * (hours * 60 + minutes)
                self.date_time_utc = local_dt - timedelta(minutes=total_minutes)
                return
            else:
                raise ValueError(f"Invalid UTC offset format: {tz_identifier}")

        # Handle IANA timezone identifier
        try:
            tz = ZoneInfo(tz_identifier)
            # Localize the naive datetime to the user's timezone
            localized_dt = local_dt.replace(tzinfo=tz)
            # Convert to UTC
            self.date_time_utc = localized_dt.astimezone(ZoneInfo('UTC')).replace(tzinfo=None)
        except Exception as e:
            raise ValueError(f"Invalid timezone identifier: {tz_identifier}") from e

    def __repr__(self) -> str:
        return f"<Reminder(id={self.id}, title='{self.title}', status='{self.status}')>"
