"""
Application configuration using Pydantic Settings.

Environment variables are loaded from .env file or system environment.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Application
    APP_NAME: str = "LootLook API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # API Keys (optional for development - mock services used when absent)
    GEMINI_API_KEY: str | None = None
    SERPAPI_KEY: str | None = None

    # CORS
    CORS_ORIGINS: list[str] = ["*"]

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
