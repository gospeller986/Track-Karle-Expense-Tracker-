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
import models.category  # noqa: F401
import models.expense  # noqa: F401

# ── System category seed data ──────────────────────────────────────────────────
SYSTEM_CATEGORIES = [
    {"name": "Food & Dining",   "icon": "🍔", "color": "#FF8A00"},
    {"name": "Transport",       "icon": "🚗", "color": "#4D9EFF"},
    {"name": "Shopping",        "icon": "🛍️", "color": "#FF4D9E"},
    {"name": "Entertainment",   "icon": "🎬", "color": "#7B61FF"},
    {"name": "Health",          "icon": "💊", "color": "#00C48C"},
    {"name": "Utilities",       "icon": "⚡", "color": "#FFD700"},
    {"name": "Rent",            "icon": "🏠", "color": "#FF6B6B"},
    {"name": "Subscriptions",   "icon": "📱", "color": "#C9F31D"},
    {"name": "Travel",          "icon": "✈️", "color": "#00B4D8"},
    {"name": "Other",           "icon": "💰", "color": "#888888"},
]


async def seed_categories() -> None:
    from database import AsyncSessionLocal
    from repository.category import CategoryRepository
    async with AsyncSessionLocal() as session:
        repo = CategoryRepository(session)
        if await repo.system_count() == 0:
            for cat in SYSTEM_CATEGORIES:
                await repo.create(is_system=True, user_id=None, **cat)
            await session.commit()
            logger.info("Seeded %d system categories.", len(SYSTEM_CATEGORIES))


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    await seed_categories()
    yield


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
from routes.auth import router as auth_router              # noqa: E402
from routes.users import router as users_router            # noqa: E402
from routes.categories import router as categories_router  # noqa: E402
from routes.expenses import router as expenses_router      # noqa: E402

app.include_router(auth_router,       prefix="/api/v1/auth",       tags=["auth"])
app.include_router(users_router,      prefix="/api/v1/users",      tags=["users"])
app.include_router(categories_router, prefix="/api/v1/categories", tags=["categories"])
app.include_router(expenses_router,   prefix="/api/v1/expenses",   tags=["expenses"])
