from datetime import datetime, timezone as tz, timedelta
from sqlalchemy import select, and_, or_, update
from sqlalchemy.exc import OperationalError
from app.database import SessionLocal
from app.models.reminder import Reminder, ReminderStatus
from app.services.vapi_service import VapiService
from app.scheduler import scheduler
from app.config import settings
from apscheduler.triggers.interval import IntervalTrigger
import logging

logger = logging.getLogger(__name__)


def acquire_reminder_for_processing(db, reminder_id: int) -> Reminder | None:
    """
    Atomically acquire a reminder for processing using optimistic locking.
    Returns the reminder if successfully acquired, None otherwise.
    """
    # Use UPDATE ... WHERE to atomically claim the reminder
    stmt = (
        update(Reminder)
        .where(
            and_(
                Reminder.id == reminder_id,
                Reminder.status.in_([
                    ReminderStatus.SCHEDULED.value,
                    ReminderStatus.PENDING_RETRY.value
                ])
            )
        )
        .values(status=ReminderStatus.PROCESSING.value)
        .returning(Reminder.id)
    )

    result = db.execute(stmt)
    db.commit()

    # Check if we successfully claimed the reminder
    claimed = result.fetchone()
    if claimed:
        # Fetch the full reminder object
        return db.get(Reminder, reminder_id)
    return None


def get_due_reminder_ids(db, now_utc: datetime, window_end: datetime, limit: int) -> list[int]:
    """
    Get IDs of reminders that are due for processing.
    Includes both scheduled reminders and those pending retry.
    """
    stmt = (
        select(Reminder.id)
        .where(
            or_(
                # Scheduled reminders that are due
                and_(
                    Reminder.status == ReminderStatus.SCHEDULED.value,
                    Reminder.date_time_utc <= window_end
                ),
                # Reminders pending retry that are ready
                and_(
                    Reminder.status == ReminderStatus.PENDING_RETRY.value,
                    Reminder.next_retry_at <= now_utc
                )
            )
        )
        .order_by(Reminder.date_time_utc.asc())
        .limit(limit)
    )

    return [row[0] for row in db.execute(stmt).fetchall()]


def process_single_reminder(db, reminder: Reminder, vapi_service: VapiService) -> None:
    """
    Process a single reminder: generate idempotency key, make Vapi call, handle result.
    """
    try:
        # Generate idempotency key for this attempt
        idempotency_key = reminder.generate_idempotency_key()
        reminder.attempt_count += 1
        db.commit()

        logger.info(
            f"Processing reminder {reminder.id} "
            f"(attempt {reminder.attempt_count}/{reminder.max_attempts}, "
            f"idempotency_key={idempotency_key})"
        )

        # Make Vapi call with idempotency key
        result = vapi_service.make_reminder_call(
            phone_number=reminder.phone_number,
            reminder_title=reminder.title,
            reminder_message=reminder.message,
            idempotency_key=idempotency_key
        )

        if result["success"]:
            # Success - mark as completed
            reminder.status = ReminderStatus.COMPLETED.value
            reminder.vapi_call_id = result.get("call_id")
            reminder.last_error = None
            logger.info(f"Call initiated for reminder {reminder.id}, call_id={result.get('call_id')}")
        else:
            # Failed - check if we should retry
            handle_reminder_failure(reminder, result.get("error", "Unknown error"))

        db.commit()

    except Exception as e:
        logger.error(f"Exception processing reminder {reminder.id}: {e}")
        db.rollback()

        # Refresh the reminder and handle failure
        db.refresh(reminder)
        handle_reminder_failure(reminder, str(e))
        db.commit()


def handle_reminder_failure(reminder: Reminder, error: str) -> None:
    """
    Handle a failed reminder: either schedule retry or mark as permanently failed.
    """
    reminder.last_error = error

    if reminder.attempt_count < reminder.max_attempts:
        # Schedule retry with exponential backoff
        reminder.status = ReminderStatus.PENDING_RETRY.value
        next_retry = reminder.calculate_next_retry(settings.RETRY_BASE_DELAY_SECONDS)
        logger.warning(
            f"Reminder {reminder.id} failed (attempt {reminder.attempt_count}/{reminder.max_attempts}), "
            f"scheduling retry at {next_retry}. Error: {error}"
        )
    else:
        # Max retries exceeded - mark as permanently failed
        reminder.status = ReminderStatus.FAILED.value
        reminder.next_retry_at = None
        logger.error(
            f"Reminder {reminder.id} permanently failed after {reminder.attempt_count} attempts. "
            f"Error: {error}"
        )


def reset_stuck_reminders() -> int:
    """
    Reset reminders that have been stuck in PROCESSING state for too long.
    This handles cases where a server crashes mid-processing.
    Returns the number of reminders reset.
    """
    db = SessionLocal()

    try:
        timeout_threshold = datetime.now(tz.utc) - timedelta(
            minutes=settings.STUCK_PROCESSING_TIMEOUT_MINUTES
        )

        # Find and reset stuck reminders
        stmt = (
            update(Reminder)
            .where(
                and_(
                    Reminder.status == ReminderStatus.PROCESSING.value,
                    Reminder.updated_at < timeout_threshold
                )
            )
            .values(status=ReminderStatus.PENDING_RETRY.value)
        )

        result = db.execute(stmt)
        reset_count = result.rowcount
        db.commit()

        if reset_count > 0:
            logger.warning(
                f"Reset {reset_count} stuck reminders from PROCESSING to PENDING_RETRY "
                f"(stuck for >{settings.STUCK_PROCESSING_TIMEOUT_MINUTES} minutes)"
            )

        return reset_count

    except OperationalError as e:
        logger.error(f"Database error in reset_stuck_reminders: {e}")
        db.rollback()
        return 0
    except Exception as e:
        logger.error(f"Error in reset_stuck_reminders: {e}")
        return 0
    finally:
        db.close()


def process_due_reminders():
    """
    Poll database for due reminders and trigger Vapi calls.
    Uses optimistic locking to prevent double-processing in multi-server deployments.
    """
    db = SessionLocal()
    vapi_service = VapiService()

    try:
        now_utc = datetime.now(tz.utc)
        window_end = now_utc + timedelta(seconds=settings.SCHEDULER_POLL_INTERVAL_SECONDS)

        # Get IDs of due reminders (limited batch size)
        reminder_ids = get_due_reminder_ids(
            db, now_utc, window_end, settings.SCHEDULER_BATCH_SIZE
        )

        if not reminder_ids:
            logger.debug("No due reminders found")
            return

        logger.info(f"Found {len(reminder_ids)} potentially due reminders")

        processed_count = 0
        for reminder_id in reminder_ids:
            # Try to acquire the reminder atomically
            reminder = acquire_reminder_for_processing(db, reminder_id)

            if reminder is None:
                # Another instance already claimed this reminder
                logger.debug(f"Reminder {reminder_id} already being processed by another instance")
                continue

            # Process the reminder
            process_single_reminder(db, reminder, vapi_service)
            processed_count += 1

        logger.info(f"Processed {processed_count} reminders this cycle")

    except OperationalError as e:
        logger.error(f"Database error in process_due_reminders: {e}")
        db.rollback()
    except Exception as e:
        logger.error(f"Error in process_due_reminders: {e}")
    finally:
        db.close()


# Register jobs with scheduler
scheduler.add_job(
    func=process_due_reminders,
    trigger=IntervalTrigger(seconds=settings.SCHEDULER_POLL_INTERVAL_SECONDS),
    id="process_due_reminders",
    name="Process due reminders and make Vapi calls",
    replace_existing=True
)

scheduler.add_job(
    func=reset_stuck_reminders,
    trigger=IntervalTrigger(minutes=settings.STUCK_PROCESSING_TIMEOUT_MINUTES),
    id="reset_stuck_reminders",
    name="Reset reminders stuck in PROCESSING state",
    replace_existing=True
)
