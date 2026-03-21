# Backend Guidelines — Expense Tracker

## Stack

- Python 3.11+
- FastAPI (async)
- SQLAlchemy 2.0 (async ORM)
- Alembic (schema migrations)
- Pydantic v2 (request/response validation)
- aiosqlite (async SQLite driver)
- python-jose (JWT)
- passlib + bcrypt (password hashing)
- uv (package management)

## Directory Structure

```
backend/
├── main.py                 # App entry point, middleware, router registration,
│                           # GET /join/{token} HTML redirect endpoint
├── config.py               # Settings from environment variables
├── database.py             # Async engine, session factory, create_tables (bootstrap only)
├── alembic/                # Migration scripts — use for ALL schema changes
│   ├── env.py
│   └── versions/
│       ├── 0001_initial.py
│       ├── 0002_add_expenses_subscriptions.py
│       └── 0003_add_group_invite_token.py
├── models/                 # SQLAlchemy ORM models (one file per domain)
│   ├── base.py             # Base declarative class
│   ├── user.py
│   ├── refresh_token.py
│   ├── password_reset_token.py
│   ├── category.py
│   ├── expense.py
│   ├── subscription.py
│   ├── group.py            # Group + GroupMember
│   ├── group_expense.py    # GroupExpense + GroupExpenseSplit
│   └── settlement.py
├── schemas/                # Pydantic request/response schemas
├── repository/             # Data access layer — all DB queries live here
├── services/               # Business logic layer
└── routes/                 # FastAPI routers — thin controllers only
```

## The Golden Rule: Never Touch the Database File

The SQLite database (`expense_tracker.db`) is treated as **production data**.

- **NEVER delete the `.db` file**
- **NEVER use `Base.metadata.drop_all()` or `Base.metadata.create_all()` for schema changes**
- `create_tables()` in `database.py` is only for initial bootstrap — do not call it to "reset"
- All schema changes **must go through Alembic migrations**

### Making Schema Changes

```bash
# 1. Modify the SQLAlchemy model in models/
# 2. Generate a migration
cd backend
alembic revision --autogenerate -m "add column foo to table bar"
# 3. Review the generated migration carefully — autogenerate is not perfect
# 4. Apply it
alembic upgrade head
# 5. Roll back if needed
alembic downgrade -1
```

**Important:** Group tables (groups, group_members, etc.) were created by `create_tables()` before
migrations covered them. If autogenerate detects them, drop those `create_table` ops from the
migration and only include the actual changes.

## Layering Rules

```
Route (routes/)
  └→ Service (services/)      ← business logic, orchestration
       └→ Repository (repository/)  ← DB queries only, returns ORM instances
            └→ Model (models/)      ← ORM schema only, no methods
```

- Routes: parse request → call service/repo → return response. No direct DB queries.
- Services: business logic, multiple repo calls, raise HTTPExceptions.
- Repositories: SQLAlchemy queries only. Return ORM model instances, not dicts.
- Models: define columns and relationships only.

**Note:** `routes/groups.py` calls `GroupRepository` directly (no service layer) — acceptable
for straightforward CRUD. Add a service layer when cross-domain logic is needed.

## camelCase Serialization

All API responses use camelCase via Pydantic alias generator. Every schema file uses:

```python
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

class _CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )
```

Always add `response_model_by_alias=True` to every router decorator.

Custom alias override example (category `is_system` → `isDefault`):
```python
alias_generator=lambda f: "isDefault" if f == "is_system" else to_camel(f),
```

## Groups Module

### Models (`models/group.py`)

```python
Group: id, name, icon, description, created_by (FK→users), invite_token (unique), created_at, updated_at
GroupMember: id, group_id (FK→groups CASCADE), user_id (FK→users), role ("admin"|"member"), joined_at
```

### Repository (`repository/group.py`) — `GroupRepository`

Key methods:
- `get_by_id(group_id)` — loads with `selectinload(Group.members).selectinload(GroupMember.user)`
- `list_for_user(user_id)` — joins on GroupMember, ordered by created_at desc
- `create(user_id, name, icon, description)` — creates Group + admin GroupMember, auto-generates invite_token via `secrets.token_urlsafe(32)`
- `generate_invite_token(group_id)` — rotates token (invalidates old QR)
- `get_by_invite_token(token)` — lookup for join flow
- `add_member(group_id, user_id)` — adds as "member" role
- `is_member(group_id, user_id)` — boolean guard
- `compute_balance(group_id, user_id)` — net balance (returns 0 until group expenses built)
- `get_friends(user_id)` — co-members across groups (no Friendship model; derived by JOIN)

### Routes (`routes/groups.py`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/groups` | Create group (creator becomes admin member) |
| GET | `/api/v1/groups` | List groups for current user |
| GET | `/api/v1/groups/{id}` | Get group detail |
| PUT | `/api/v1/groups/{id}` | Update group (members only) |
| DELETE | `/api/v1/groups/{id}` | Delete group (creator only) |
| POST | `/api/v1/groups/{id}/generate-invite` | Rotate invite token (any member) |
| POST | `/api/v1/groups/join` | Join via token (idempotent) |
| GET | `/api/v1/groups/friends/list` | List implicit friends |

`GroupResponse` includes `created_by` field — frontend uses it to gate delete (creator only).

### Invite Link Generation

```python
# routes/groups.py
def _build_invite_link(base_url: str, token: str) -> str:
    return f"{base_url.rstrip('/')}/join/{token}"
    # e.g. http://192.168.1.3:8000/join/<token>

# base_url comes from request.base_url (uses Host header → real LAN IP)
```

### HTTP Redirect Page (`main.py` — outside /api/v1)

`GET /join/{token}` serves an HTML page that:
1. Immediately tries `exptracker://join/{token}` (production/dev-client)
2. After 800ms, tries `exp://{host}:8081/--/join/{token}` (Expo Go)
3. After 2500ms, shows manual fallback link

## Authentication

- Access tokens: 15-minute expiry, JWT, signed with `SECRET_KEY`
- Refresh tokens: 30-day expiry, stored as bcrypt hash in DB, rotated on each use
- Password reset tokens: single-use, bcrypt hash, 1-hour expiry
- All protected routes depend on `get_current_user` from `routes/auth.py`

## Starting the Server

```bash
cd backend
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Always bind to `0.0.0.0` so Expo Go on a physical device can connect over LAN.

## System Data Seeding

Seed data (system categories) is inserted at startup via lifespan with idempotency guard:

```python
if await repo.system_count() == 0:
    # insert seed data
```

Never re-seed by deleting existing rows.

## Error Responses

```python
raise HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail={"code": "NOT_FOUND", "message": "Resource not found."},
)
```

Standard error codes: `NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, `CONFLICT`, `VALIDATION_ERROR`.

## Model Conventions

- Primary keys: `String(36)` UUIDs generated with `uuid4`
- Timestamps: `created_at` (default=now), `updated_at` (onupdate=now) where relevant
- Soft deletes: not used — hard deletes only
- Cascade: `ondelete="CASCADE"` on FK for dependent records
- Nullable FKs: allowed for optional ownership (e.g., `category.user_id` NULL = system category)

## Dependency Management

```bash
uv add <package>       # add a dependency
uv remove <package>    # remove
uv sync                # install from uv.lock
uv run <command>       # run in the venv
```

Never use `pip install` directly.
