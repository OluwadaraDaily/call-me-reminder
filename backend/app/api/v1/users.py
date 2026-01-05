from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.dependencies import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/signup", response_model=UserResponse, status_code=201)
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Create a new user account.

    - **email**: User's email address (must be unique)
    """
    # Check if user already exists
    stmt = select(User).where(User.email == user_data.email)
    existing_user = db.scalars(stmt).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Create new user
    new_user = User(email=user_data.email)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/login", response_model=UserResponse)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """
    Login with email.

    - **email**: User's email address
    """
    # Find user by email
    stmt = select(User).where(User.email == user_data.email)
    user = db.scalars(stmt).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found. Please sign up first."
        )

    return user


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """
    Get user by ID.

    - **user_id**: User's unique identifier
    """
    stmt = select(User).where(User.id == user_id)
    user = db.scalars(stmt).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user
