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
├── main.py                 # App entry point, middleware, router registration
├── config.py               # Settings from environment variables
├── database.py             # Async engine, session factory, create_tables (initial only)
├── alembic/                # Migration scripts — use for ALL schema changes
│   ├── env.py
│   └── versions/
├── models/                 # SQLAlchemy ORM models (one file per table)
├── schemas/                # Pydantic request/response schemas
├── repository/             # Data access layer — all DB queries live here
├── services/               # Business logic layer
└── routes/                 # FastAPI routers — thin controllers only
```

## The Golden Rule: Never Touch the Database File

The SQLite database (`expense_tracker.db`) is treated as **production data**.

- **NEVER delete the `.db` file**
- **NEVER use `Base.metadata.drop_all()` or `Base.metadata.create_all()` for schema changes**
- `create_tables()` in `database.py` is only for the very first bootstrap — do not call it to "reset" the schema
- All schema changes **must go through Alembic migrations**

### Making Schema Changes

```bash
# 1. Modify the SQLAlchemy model in models/
# 2. Generate a migration
cd backend
alembic revision --autogenerate -m "add expense table"
# 3. Review the generated migration in alembic/versions/
# 4. Apply it
alembic upgrade head
# 5. To roll back if needed
alembic downgrade -1
```

Never skip the review step. Autogenerate is not perfect — always verify the generated SQL.

## Layering Rules

```
Route (routes/)
  └→ Service (services/)     ← business logic, validation, orchestration
       └→ Repository (repository/)  ← DB queries only, no business logic
            └→ Model (models/)      ← ORM schema only, no methods
```

- Routes only: parse request, call service, return response. No direct DB queries.
- Services only: business logic, calling multiple repositories, raising HTTP exceptions.
- Repositories only: SQLAlchemy queries. Return ORM model instances, not dicts.
- Models: define columns and relationships. No business methods.

## camelCase Serialization

All API responses use camelCase via Pydantic alias generator. Apply to every schema:

```python
from pydantic import ConfigDict
from pydantic.alias_generators import to_camel

class _CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )
```

Custom alias overrides (when field name doesn't map cleanly):
```python
model_config = ConfigDict(
    alias_generator=lambda f: "isDefault" if f == "is_system" else to_camel(f),
    populate_by_name=True,
    from_attributes=True,
)
```

Always add `response_model_by_alias=True` to router decorators.

## Authentication

- Access tokens: 15-minute expiry, JWT
- Refresh tokens: 30-day expiry, stored as bcrypt hash in DB, rotated on each use
- Password reset tokens: single-use, stored as bcrypt hash, 1-hour expiry
- All protected routes depend on `get_current_user` from `routes/auth.py`
- Token storage on client: `expo-secure-store`

## Starting the Server

Always bind to all interfaces so Expo Go on a physical device can connect:

```bash
cd backend
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## System Data Seeding

Seed data (system categories, etc.) is inserted at startup via lifespan with an idempotency guard:

```python
if await repo.system_count() == 0:
    # insert seed data
```

Never re-seed by deleting existing rows. Idempotency must be maintained.

## Error Responses

Use `HTTPException` with structured detail objects:

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
- Nullable FKs: allowed for optional ownership (e.g., `category.user_id` is NULL for system categories)
- Cascade deletes: use `ondelete="CASCADE"` on FK definitions for dependent records

## Dependency Management

Use `uv` for all package operations:

```bash
uv add <package>       # add a dependency
uv remove <package>    # remove a dependency
uv sync                # install all deps from uv.lock
uv run <command>       # run a command in the venv
```

Never use `pip install` directly in this project.
