from fastapi import Response
from app.config import settings

# Determine SameSite policy based on environment and cookie domain
# For cross-subdomain setups (different frontend/backend subdomains), use "none"
# For same-domain setups, use "lax" for better security
_is_cross_origin = bool(settings.COOKIE_DOMAIN)
_samesite_policy = "none" if _is_cross_origin else "lax"

# Build base cookie config
_base_config = {
    "httponly": True,
    "secure": settings.ENVIRONMENT == "production",
    "samesite": _samesite_policy,
    "path": "/",
}

# Add domain only if configured (for cross-subdomain setups)
if settings.COOKIE_DOMAIN:
    _base_config["domain"] = settings.COOKIE_DOMAIN

COOKIE_CONFIG = {
    "access_token": {
        **_base_config,
        "max_age": 30 * 60,  # 30 minutes in seconds
    },
    "refresh_token": {
        **_base_config,
        "max_age": 7 * 24 * 60 * 60,  # 7 days in seconds
    },
    "refresh_token_session": {
        **_base_config,
        "max_age": None,  # Session cookie (expires when browser closes)
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
    # Build clear config with same domain/samesite settings
    clear_config = {
        "max_age": 0,
        "httponly": True,
        "samesite": _samesite_policy,
        "path": "/",
    }
    if settings.COOKIE_DOMAIN:
        clear_config["domain"] = settings.COOKIE_DOMAIN

    response.set_cookie(key="access_token", value="", **clear_config)
    response.set_cookie(key="refresh_token", value="", **clear_config)
