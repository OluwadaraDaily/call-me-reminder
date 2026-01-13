from fastapi import APIRouter, Depends

from app.dependencies import get_current_user_from_cookie
from app.models.user import User
from app.schemas.user import UserResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user_from_cookie)):
    """
    Get current authenticated user information.

    Requires valid access token in httpOnly cookie.
    """
    return current_user
