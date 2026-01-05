from pydantic import BaseModel


class Token(BaseModel):
    """Schema for token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    """Schema for refresh token request."""
    refresh_token: str


class TokenResponse(BaseModel):
    """Schema for new access token response."""
    access_token: str
    token_type: str = "bearer"
