from __future__ import annotations
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from config import settings

_is_sqlite = not settings.is_postgres

engine = create_async_engine(
    settings.async_database_url,
    echo=settings.debug,
    connect_args={"check_same_thread": False} if _is_sqlite else {"ssl": "require"},
    **({} if _is_sqlite else {
        "pool_size": 5,
        "max_overflow": 10,
        "pool_timeout": 30,
        "pool_pre_ping": True,   # detect stale connections (Neon auto-pauses)
    }),
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    """FastAPI dependency — yields a DB session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def create_tables() -> None:
    """Create all tables on startup (dev convenience). Use Alembic for prod."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
