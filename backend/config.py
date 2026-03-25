from __future__ import annotations
from urllib.parse import urlparse, urlencode, parse_qs, urlunparse
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App
    app_name: str = "Expense Tracker API"
    app_version: str = "0.1.0"
    debug: bool = False

    # Database — set DATABASE_URL in .env or environment.
    # Falls back to local SQLite for development without a .env file.
    database_url: str = "sqlite+aiosqlite:///./expense_tracker.db"

    # Auth
    secret_key: str = "change-me-in-production-use-openssl-rand-hex-32"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    refresh_token_expire_days: int = 30

    # CORS
    allowed_origins: list[str] = ["*"]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def is_postgres(self) -> bool:
        return self.database_url.startswith(("postgresql://", "postgres://"))

    @property
    def async_database_url(self) -> str:
        """Return the database URL with the correct async driver scheme.

        - sqlite stays as-is (aiosqlite already async)
        - postgresql:// / postgres:// → postgresql+asyncpg://
        - Strips SSL params (sslmode, channel_binding) — asyncpg handles SSL
          via connect_args instead of URL query parameters.
        """
        url = self.database_url
        if self.is_postgres:
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
            # Strip params asyncpg doesn't accept in the URL
            _strip = {"sslmode", "channel_binding"}
            parsed = urlparse(url)
            params = {k: v[0] for k, v in parse_qs(parsed.query).items() if k not in _strip}
            url = urlunparse(parsed._replace(query=urlencode(params)))
        return url


settings = Settings()
