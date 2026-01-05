from fastapi import HTTPException


class DatabaseException(HTTPException):
    """Base exception for database-related errors."""

    def __init__(self, detail: str):
        super().__init__(status_code=500, detail=detail)


class NotFoundException(HTTPException):
    """Exception raised when a resource is not found."""

    def __init__(self, detail: str = "Resource not found"):
        super().__init__(status_code=404, detail=detail)


class ValidationException(HTTPException):
    """Exception raised for validation errors."""

    def __init__(self, detail: str):
        super().__init__(status_code=422, detail=detail)
