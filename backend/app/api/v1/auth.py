from datetime import datetime, timedelta
import secrets
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.dependencies import get_db, get_current_user, get_current_user_from_cookie
from app.schemas.auth import TokenRefresh, TokenResponse, Token
from app.schemas.user import UserCreate, UserLogin, PasswordResetRequest, PasswordResetConfirm, PasswordChange
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.core.password import hash_password, verify_password
from app.core.cookies import set_auth_cookies, clear_auth_cookies, COOKIE_CONFIG
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(user_data: UserCreate, response: Response, db: Session = Depends(get_db)):
    """
    Create a new user account and set httpOnly cookies.

    - **email**: User's email address (must be unique)
    - **password**: Password (min 8 chars, uppercase, lowercase, digit)
    - **remember_me**: If True, refresh token persists for 7 days; if False, session cookie
    """
    # Check if user already exists
    stmt = select(User).where(User.email == user_data.email)
    existing_user = db.scalars(stmt).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Hash password before storing
    hashed_password = hash_password(user_data.password)

    # Create new user with hashed password
    new_user = User(
        email=user_data.email,
        password_hash=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Generate tokens
    access_token = create_access_token(data={"sub": str(new_user.id), "email": new_user.email})
    refresh_token = create_refresh_token(data={"sub": str(new_user.id)})

    # Store refresh token
    refresh_token_model = RefreshToken(token=refresh_token, user_id=new_user.id)
    db.add(refresh_token_model)
    db.commit()

    # Set httpOnly cookies
    set_auth_cookies(response, access_token, refresh_token, user_data.remember_me)

    return {"message": "Account created successfully"}


@router.post("/login", status_code=status.HTTP_200_OK)
def login(user_data: UserLogin, response: Response, db: Session = Depends(get_db)):
    """
    Login with email and password, set httpOnly cookies.

    - **email**: User's email address
    - **password**: User's password
    - **remember_me**: If True, refresh token persists for 7 days; if False, session cookie
    """
    # Find user by email
    stmt = select(User).where(User.email == user_data.email)
    user = db.scalars(stmt).first()

    # Use generic error message to prevent user enumeration
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Check if user has password set (for existing users from migration)
    if user.password_hash is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Password not set. Please reset your password."
        )

    # Verify password using timing-safe comparison
    if not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Generate tokens
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    # Store refresh token
    refresh_token_model = RefreshToken(token=refresh_token, user_id=user.id)
    db.add(refresh_token_model)
    db.commit()

    # Set httpOnly cookies
    set_auth_cookies(response, access_token, refresh_token, user_data.remember_me)

    return {"message": "Login successful"}


@router.post("/refresh", status_code=status.HTTP_200_OK)
def refresh_access_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Refresh access token using refresh token from httpOnly cookie.

    The refresh token is automatically read from the httpOnly cookie.
    No request body needed.
    """
    # Read refresh token from cookie
    refresh_token = request.cookies.get("refresh_token")

    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found"
        )

    # Decode refresh token
    payload = decode_token(refresh_token)
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
        RefreshToken.token == refresh_token,
        RefreshToken.is_revoked == False
    )
    refresh_token_model = db.scalars(stmt).first()

    if not refresh_token_model:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked refresh token"
        )

    # Get user
    user_id_str = payload.get("sub")
    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token"
        )

    stmt = select(User).where(User.id == user_id)
    user = db.scalars(stmt).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    # Generate new access token
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})

    # Update only access token cookie (refresh token stays the same)
    response.set_cookie(
        key="access_token",
        value=access_token,
        **COOKIE_CONFIG["access_token"]
    )

    return {"message": "Token refreshed successfully"}


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user_from_cookie),
    db: Session = Depends(get_db)
):
    """
    Logout by revoking refresh token and clearing httpOnly cookies.

    The refresh token is automatically read from the httpOnly cookie.
    """
    # Read refresh token from cookie
    refresh_token = request.cookies.get("refresh_token")

    if refresh_token:
        # Find and revoke refresh token
        stmt = select(RefreshToken).where(
            RefreshToken.token == refresh_token,
            RefreshToken.user_id == current_user.id
        )
        refresh_token_model = db.scalars(stmt).first()

        if refresh_token_model:
            refresh_token_model.is_revoked = True
            db.commit()

    # Clear httpOnly cookies
    clear_auth_cookies(response)

    return None


@router.post("/password-reset/request", status_code=status.HTTP_200_OK)
def request_password_reset(
    reset_request: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    """
    Request a password reset link.

    - **email**: User's email address

    Note: Always returns success to prevent user enumeration.
    If the email exists, a reset token is generated and logged (dev mode).
    """
    # Find user by email
    stmt = select(User).where(User.email == reset_request.email)
    user = db.scalars(stmt).first()

    # Always return success message (prevent user enumeration)
    success_message = {"message": "If the email exists, a reset link has been sent"}

    if not user:
        return success_message

    # Generate cryptographically secure reset token
    reset_token = secrets.token_urlsafe(32)

    # Set token and expiry (1 hour from now)
    user.reset_token = reset_token
    user.reset_token_expires_at = datetime.utcnow() + timedelta(hours=1)
    db.commit()

    # TODO: Send email with reset link in production
    # For development, log the token to file
    if settings.DEBUG == True:
        log_dir = Path("dev_logs")
        log_dir.mkdir(exist_ok=True)
        log_file = log_dir / "dev_reset_token.log"

        log_entry = f"\n{'='*60}\n"
        log_entry += f"PASSWORD RESET TOKEN FOR: {user.email}\n"
        log_entry += f"Token: {reset_token}\n"
        log_entry += f"Expires: {user.reset_token_expires_at}\n"
        log_entry += f"Reset URL: http://localhost:3000/reset-password?token={reset_token}\n"
        log_entry += f"Timestamp: {datetime.utcnow()}\n"
        log_entry += f"{'='*60}\n"

        with open(log_file, "a") as f:
            f.write(log_entry)

        print(f"Password reset token logged to {log_file}")
    return success_message


@router.post("/password-reset/confirm", status_code=status.HTTP_200_OK)
def confirm_password_reset(
    reset_confirm: PasswordResetConfirm,
    db: Session = Depends(get_db)
):
    """
    Confirm password reset with token and set new password.

    - **reset_token**: Reset token from email
    - **new_password**: New password (min 8 chars, uppercase, lowercase, digit)
    """
    # Find user by reset token
    stmt = select(User).where(User.reset_token == reset_confirm.reset_token)
    user = db.scalars(stmt).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )

    # Check if token is expired
    if user.reset_token_expires_at is None or user.reset_token_expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )

    # Hash new password
    user.password_hash = hash_password(reset_confirm.new_password)

    # Clear reset token (single-use token)
    user.reset_token = None
    user.reset_token_expires_at = None

    db.commit()

    return {"message": "Password reset successful"}


@router.post("/password/change", status_code=status.HTTP_200_OK)
def change_password(
    password_change: PasswordChange,
    current_user: User = Depends(get_current_user_from_cookie),
    db: Session = Depends(get_db)
):
    """
    Change password for authenticated user.

    - **current_password**: Current password for verification
    - **new_password**: New password (min 8 chars, uppercase, lowercase, digit)

    Requires authentication.
    """
    # Verify current password
    if current_user.password_hash is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No password set. Please use password reset."
        )

    if not verify_password(password_change.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect"
        )

    # Hash and set new password
    current_user.password_hash = hash_password(password_change.new_password)
    db.commit()

    return {"message": "Password changed successfully"}
