# Claude Code Guidelines — Expense Tracker

## Critical Rules

### Never Destroy Production Data
- **NEVER delete the database file** (`expense_tracker.db` or any `.db` file). It is treated as production data.
- **NEVER run `DROP TABLE`, `DELETE FROM`, or truncate commands** without explicit user confirmation.
- **NEVER use `create_tables()` / `Base.metadata.create_all()`** as a schema migration strategy. Always use Alembic.
- For schema changes, generate an Alembic migration: `alembic revision --autogenerate -m "description"`, then apply with `alembic upgrade head`.
- If a migration fails, diagnose and fix — do not recreate the DB as a shortcut.

### Code Size — Frontend
- **No React Native component file should exceed 400 lines.** Split into sub-components when approaching this limit.
- Extract complex logic into hooks (`hooks/`), not inline in screens.

### Type Organization — Frontend
- **TypeScript types** (primitives, unions, mapped types) go in `frontend/types/`.
- **TypeScript interfaces** (object shapes, contracts) go in `frontend/interfaces/`.
- Do not define types/interfaces inline in component files or service files unless they are file-local implementation details.

### Respect Existing Conventions
- Backend uses camelCase aliases via Pydantic `to_camel` — all API responses are camelCase. Frontend types must match exactly.
- Backend follows Repository → Service → Route layering. Keep business logic in services, not routes.
- Frontend hooks handle data fetching; screens only consume hooks and render UI.

## Architecture References
- [Architecture Overview](docs/architecture.md)
- [Frontend Guidelines](docs/frontend.md)
- [Backend Guidelines](docs/backend.md)
