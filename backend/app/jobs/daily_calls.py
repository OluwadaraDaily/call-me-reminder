from datetime import datetime, timezone as tz, timedelta
from sqlalchemy import select, and_
from app.database import SessionLocal
from app.models.reminder import Reminder, ReminderStatus
from app.services.vapi_service import VapiService
from app.scheduler import scheduler
from app.config import settings
from apscheduler.triggers.interval import IntervalTrigger
import logging

logger = logging.getLogger(__name__)


def process_due_reminders():
    """Poll database for due reminders and trigger Vapi calls."""
    db = SessionLocal()
    vapi_service = VapiService()

    try:
        now_utc = datetime.now(tz.utc)
        window_end = now_utc + timedelta(seconds=settings.SCHEDULER_POLL_INTERVAL_SECONDS)

        stmt = select(Reminder).where(
            and_(
                Reminder.status == ReminderStatus.SCHEDULED.value,
                Reminder.date_time_utc <= window_end
            )
        )

        reminders = list(db.scalars(stmt).all())

        logger.info(f"Found {len(reminders)} due reminders to process")

        for reminder in reminders:
            try:
                logger.info(f"Processing reminder {reminder.id}")

                # Make Vapi call
                result = vapi_service.make_reminder_call(
                    phone_number=reminder.phone_number,
                    reminder_title=reminder.title,
                    reminder_message=reminder.message
                )

                # Update status
                if result["success"]:
                    reminder.status = ReminderStatus.COMPLETED.value
                    logger.info(f"Call initiated for reminder {reminder.id}")
                else:
                    reminder.status = ReminderStatus.FAILED.value
                    logger.error(f"Call failed for reminder {reminder.id}: {result.get('error')}")

                db.commit()

            except Exception as e:
                logger.error(f"Error processing reminder {reminder.id}: {e}")
                reminder.status = ReminderStatus.FAILED.value
                db.commit()

    except Exception as e:
        logger.error(f"Error in process_due_reminders: {e}")
    finally:
        db.close()


# Register job with scheduler
scheduler.add_job(
    func=process_due_reminders,
    trigger=IntervalTrigger(seconds=settings.SCHEDULER_POLL_INTERVAL_SECONDS),
    id="process_due_reminders",
    name="Process due reminders and make Vapi calls",
    replace_existing=True
)
