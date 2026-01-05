from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.dependencies import get_db, get_current_user
from app.schemas.auth import TokenRefresh, TokenResponse, Token
from app.schemas.user import UserCreate, UserLogin
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.core.security import create_access_token, create_refresh_token, decode_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Create a new user account and return JWT tokens.

    - **email**: User's email address (must be unique)
    """
    # Check if user already exists
    stmt = select(User).where(User.email == user_data.email)
    existing_user = db.scalars(stmt).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
    new_user = User(email=user_data.email)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Generate tokens
    access_token = create_access_token(data={"sub": new_user.id, "email": new_user.email})
    refresh_token = create_refresh_token(data={"sub": new_user.id})

    # Store refresh token
    refresh_token_model = RefreshToken(token=refresh_token, user_id=new_user.id)
    db.add(refresh_token_model)
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """
    Login with email and return JWT tokens.

    - **email**: User's email address
    """
    # Find user by email
    stmt = select(User).where(User.email == user_data.email)
    user = db.scalars(stmt).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please sign up first."
        )

    # Generate tokens
    access_token = create_access_token(data={"sub": user.id, "email": user.email})
    refresh_token = create_refresh_token(data={"sub": user.id})

    # Store refresh token
    refresh_token_model = RefreshToken(token=refresh_token, user_id=user.id)
    db.add(refresh_token_model)
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/refresh", response_model=TokenResponse)
def refresh_access_token(
    token_data: TokenRefresh,
    db: Session = Depends(get_db)
):
    """
    Refresh access token using refresh token.

    - **refresh_token**: Valid refresh token
    """
    # Decode refresh token
    payload = decode_token(token_data.refresh_token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    # Verify token type
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type"
        )

    # Check if token exists and is not revoked
    stmt = select(RefreshToken).where(
        RefreshToken.token == token_data.refresh_token,
        RefreshToken.is_revoked == False
    )
    refresh_token_model = db.scalars(stmt).first()

    if not refresh_token_model:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked refresh token"
        )

    # Get user
    user_id = payload.get("sub")
    stmt = select(User).where(User.id == user_id)
    user = db.scalars(stmt).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    # Generate new access token
    access_token = create_access_token(data={"sub": user.id, "email": user.email})

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    token_data: TokenRefresh,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Logout by revoking refresh token.

    - **refresh_token**: Refresh token to revoke
    """
    # Find and revoke refresh token
    stmt = select(RefreshToken).where(
        RefreshToken.token == token_data.refresh_token,
        RefreshToken.user_id == current_user.id
    )
    refresh_token_model = db.scalars(stmt).first()

    if refresh_token_model:
        refresh_token_model.is_revoked = True
        db.commit()

    return None
