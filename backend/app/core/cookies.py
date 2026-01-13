from fastapi import Response
from app.config import settings

COOKIE_CONFIG = {
    "access_token": {
        "max_age": 30 * 60,  # 30 minutes in seconds
        "httponly": True,
        "secure": settings.ENVIRONMENT == "production",
        "samesite": "lax",
        "path": "/",
    },
    "refresh_token": {
        "max_age": 7 * 24 * 60 * 60,  # 7 days in seconds
        "httponly": True,
        "secure": settings.ENVIRONMENT == "production",
        "samesite": "lax",
        "path": "/",
    },
    "refresh_token_session": {
        "max_age": None,  # Session cookie (expires when browser closes)
        "httponly": True,
        "secure": settings.ENVIRONMENT == "production",
        "samesite": "lax",
        "path": "/",
    }
}


def set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
    remember_me: bool = False
):
    """
    Set both access and refresh token cookies.

    Args:
        response: FastAPI Response object
        access_token: JWT access token
        refresh_token: JWT refresh token
        remember_me: If True, refresh token persists for 7 days. If False, session cookie.
    """
    # Set access token cookie (always 30 minutes)
    response.set_cookie(
        key="access_token",
        value=access_token,
        **COOKIE_CONFIG["access_token"]
    )

    # Set refresh token cookie (persistent or session based on remember_me)
    refresh_config = (
        COOKIE_CONFIG["refresh_token"] if remember_me
        else COOKIE_CONFIG["refresh_token_session"]
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        **refresh_config
    )


def clear_auth_cookies(response: Response):
    """
    Clear all auth cookies by setting Max-Age=0.

    Args:
        response: FastAPI Response object
    """
    response.set_cookie(
        key="access_token",
        value="",
        max_age=0,
        httponly=True,
        samesite="lax",
        path="/"
    )
    response.set_cookie(
        key="refresh_token",
        value="",
        max_age=0,
        httponly=True,
        samesite="lax",
        path="/"
    )
