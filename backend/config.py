from __future__ import annotations
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App
    app_name: str = "Expense Tracker API"
    app_version: str = "0.1.0"
    debug: bool = False

    # Database
    # SQLite for now — swap to postgresql+asyncpg://user:pass@host/db for Postgres
    database_url: str = "sqlite+aiosqlite:///./expense_tracker.db"

    # Auth
    secret_key: str = "change-me-in-production-use-openssl-rand-hex-32"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    refresh_token_expire_days: int = 30

    # CORS
    allowed_origins: list[str] = ["*"]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
