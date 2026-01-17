from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = "Call Me Reminder"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"

    # Database
    DATABASE_URL: str = "sqlite:///./data/app.db"
    TEST_DATABASE_URL: str = "sqlite:///./data/app_test.db"

    # API
    API_V1_PREFIX: str = "/api/v1"

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # JWT Settings
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Vapi Configuration
    VAPI_API_KEY: str = ""
    VAPI_PHONE_NUMBER_ID: str = ""

    # Scheduler Configuration
    SCHEDULER_POLL_INTERVAL_SECONDS: int = 60
    SCHEDULER_TIMEZONE: str = "UTC"
    SCHEDULER_BATCH_SIZE: int = 10  # Max reminders to process per poll

    # Retry Configuration
    RETRY_MAX_ATTEMPTS: int = 3
    RETRY_BASE_DELAY_SECONDS: int = 60  # Base delay for exponential backoff

    # Email Configuration (for password resets)
    EMAIL_FROM: str = "noreply@callmereminder.com"
    EMAIL_FROM_NAME: str = "Call Me Reminder"
    SENDGRID_API_KEY: str = ""  # For production email sending

    # Password Reset Configuration
    PASSWORD_RESET_TOKEN_EXPIRE_HOURS: int = 1
    FRONTEND_URL: str = "http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )

    @property
    def is_development(self) -> bool:
        """Check if the application is running in development mode."""
        return self.ENVIRONMENT == "development"

    @property
    def is_testing(self) -> bool:
        """Check if the application is running in test mode."""
        return self.ENVIRONMENT == "testing"

    @property
    def database_url(self) -> str:
        """Get the appropriate database URL based on environment."""
        if self.is_testing:
            return self.TEST_DATABASE_URL
        return self.DATABASE_URL


# Singleton pattern for settings
settings = Settings()
