from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List

from app.dependencies import get_db
from app.models.reminder import Reminder
from app.schemas.reminder import ReminderCreate, ReminderUpdate, ReminderResponse

router = APIRouter(prefix="/reminders", tags=["reminders"])


@router.post("/", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
def create_reminder(
    reminder_data: ReminderCreate,
    user_id: int = Query(..., description="User ID (TODO: Replace with JWT auth)"),
    db: Session = Depends(get_db)
):
    """
    Create a new reminder.

    - **title**: Reminder title (max 200 chars)
    - **message**: Detailed reminder message
    - **phone_number**: Phone with country code (e.g., +2348101217888)
    - **date_time**: When to send reminder (local datetime)
    - **timezone**: UTC offset (e.g., UTC+1, UTC-7)
    """
    # Create reminder
    new_reminder = Reminder(
        user_id=user_id,
        title=reminder_data.title,
        message=reminder_data.message,
        phone_number=reminder_data.phone_number,
        date_time=reminder_data.date_time,
        timezone=reminder_data.timezone,
        status="scheduled"
    )

    db.add(new_reminder)
    db.commit()
    db.refresh(new_reminder)

    return new_reminder


@router.get("/", response_model=List[ReminderResponse])
def list_reminders(
    user_id: int = Query(..., description="User ID (TODO: Replace with JWT auth)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=100, description="Maximum records to return"),
    db: Session = Depends(get_db)
):
    """
    List all reminders for a user.

    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum records to return (max 100)
    """
    stmt = (
        select(Reminder)
        .where(Reminder.user_id == user_id)
        .offset(skip)
        .limit(limit)
        .order_by(Reminder.date_time.asc())
    )
    reminders = list(db.scalars(stmt).all())

    return reminders


@router.get("/{reminder_id}", response_model=ReminderResponse)
def get_reminder(
    reminder_id: int,
    user_id: int = Query(..., description="User ID (TODO: Replace with JWT auth)"),
    db: Session = Depends(get_db)
):
    """Get a specific reminder by ID."""
    stmt = select(Reminder).where(
        Reminder.id == reminder_id,
        Reminder.user_id == user_id
    )
    reminder = db.scalars(stmt).first()

    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found"
        )

    return reminder


@router.put("/{reminder_id}", response_model=ReminderResponse)
def update_reminder(
    reminder_id: int,
    reminder_data: ReminderUpdate,
    user_id: int = Query(..., description="User ID (TODO: Replace with JWT auth)"),
    db: Session = Depends(get_db)
):
    """Update a reminder."""
    # Fetch reminder
    stmt = select(Reminder).where(
        Reminder.id == reminder_id,
        Reminder.user_id == user_id
    )
    reminder = db.scalars(stmt).first()

    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found"
        )

    # Update fields
    update_data = reminder_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(reminder, field, value)

    db.commit()
    db.refresh(reminder)

    return reminder


@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reminder(
    reminder_id: int,
    user_id: int = Query(..., description="User ID (TODO: Replace with JWT auth)"),
    db: Session = Depends(get_db)
):
    """Delete a reminder."""
    stmt = select(Reminder).where(
        Reminder.id == reminder_id,
        Reminder.user_id == user_id
    )
    reminder = db.scalars(stmt).first()

    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found"
        )

    db.delete(reminder)
    db.commit()

    return None
