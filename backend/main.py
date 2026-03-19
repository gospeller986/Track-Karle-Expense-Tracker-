from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import create_tables


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables (dev convenience — use Alembic migrations in prod)
    await create_tables()
    yield
    # Shutdown: nothing to clean up yet


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok", "version": settings.app_version}


# ── Routers registered here as we implement each section ──────────────────────
# from routes.auth import router as auth_router
# app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
