import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import create_tables

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("app")

# Import models so SQLAlchemy metadata is populated before create_tables() runs.
import models.user  # noqa: F401
import models.refresh_token  # noqa: F401
import models.password_reset_token  # noqa: F401


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


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    body = await request.body()
    logger.info(">>> %s %s | client=%s | body=%s", request.method, request.url.path, request.client, body.decode()[:200])
    response = await call_next(request)
    ms = (time.time() - start) * 1000
    logger.info("<<< %s %s | status=%d | %.1fms", request.method, request.url.path, response.status_code, ms)
    return response


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok", "version": settings.app_version}


# ── Routers ────────────────────────────────────────────────────────────────────
from routes.auth import router as auth_router    # noqa: E402
from routes.users import router as users_router  # noqa: E402

app.include_router(auth_router,  prefix="/api/v1/auth",  tags=["auth"])
app.include_router(users_router, prefix="/api/v1/users", tags=["users"])
