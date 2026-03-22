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
import models.subscription  # noqa: F401
import models.group  # noqa: F401
import models.group_expense  # noqa: F401
import models.settlement  # noqa: F401

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


@app.get("/join/{token}", tags=["invite"], include_in_schema=False)
async def join_redirect(token: str, request: Request):
    from fastapi.responses import HTMLResponse
    prod_link = f"exptracker://join/{token}"
    # In Expo Go the registered scheme is exp://<host>:8081/--/<path>
    # We derive the host from the incoming request (same machine serves both backend and Metro).
    host = request.url.hostname  # e.g. 192.168.1.3
    expo_link = f"exp://{host}:8081/--/join/{token}"
    html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Join Group – Expense Tracker</title>
  <style>
    body{{font-family:sans-serif;text-align:center;padding:60px 24px;background:#0d0d0d;color:#fff}}
    a{{color:#C9F31D}}
  </style>
</head>
<body>
  <p style="font-size:48px">💸</p>
  <h2>Opening Expense Tracker…</h2>
  <p style="color:#aaa" id="msg">Connecting to app…</p>
  <script>
    // 1. Try production build first (exptracker:// registered by a standalone/dev-client build).
    //    On iOS, navigating to an unregistered scheme silently fails — the page stays open.
    window.location.href = '{prod_link}';

    // 2. After 800 ms, if we are still here, try Expo Go (exp:// is registered by the Expo Go app).
    setTimeout(function() {{
      document.getElementById('msg').innerText = 'Trying Expo Go…';
      window.location.href = '{expo_link}';
    }}, 800);

    // 3. Final manual fallback.
    setTimeout(function() {{
      document.getElementById('msg').innerHTML =
        'Could not open the app automatically.<br><br>' +
        '<a href="{prod_link}">Tap here</a> if you have a standalone build,<br>' +
        'or make sure Expo Go is open and try again.';
    }}, 2500);
  </script>
</body>
</html>"""
    return HTMLResponse(content=html)


# ── Routers ────────────────────────────────────────────────────────────────────
from routes.auth import router as auth_router                          # noqa: E402
from routes.users import router as users_router                        # noqa: E402
from routes.categories import router as categories_router              # noqa: E402
from routes.expenses import router as expenses_router                  # noqa: E402
from routes.subscriptions import router as subscriptions_router        # noqa: E402
from routes.groups import router as groups_router                      # noqa: E402
from routes.group_expenses import router as group_expenses_router      # noqa: E402
from routes.settlements import router as settlements_router            # noqa: E402

app.include_router(auth_router,            prefix="/api/v1/auth",          tags=["auth"])
app.include_router(users_router,           prefix="/api/v1/users",          tags=["users"])
app.include_router(categories_router,      prefix="/api/v1/categories",     tags=["categories"])
app.include_router(expenses_router,        prefix="/api/v1/expenses",       tags=["expenses"])
app.include_router(subscriptions_router,   prefix="/api/v1/subscriptions",  tags=["subscriptions"])
app.include_router(groups_router,          prefix="/api/v1/groups",         tags=["groups"])
app.include_router(group_expenses_router,  prefix="/api/v1/groups",         tags=["group-expenses"])
app.include_router(settlements_router,     prefix="/api/v1/groups",         tags=["settlements"])
