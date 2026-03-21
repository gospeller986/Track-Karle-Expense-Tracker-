# Architecture Overview — Expense Tracker

## System Diagram

```
┌─────────────────────────────────────────────┐
│           React Native (Expo Go)            │
│              frontend/                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Screens │→ │  Hooks   │→ │ Services │  │
│  │  app/    │  │  hooks/  │  │services/ │  │
│  └──────────┘  └──────────┘  └────┬─────┘  │
└───────────────────────────────────│─────────┘
                                    │ HTTP/JSON (LAN IP)
┌───────────────────────────────────▼─────────┐
│            FastAPI Backend                  │
│              backend/                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Routes  │→ │ Services │→ │  Repos   │  │
│  │ routes/  │  │services/ │  │repository│  │
│  └──────────┘  └──────────┘  └────┬─────┘  │
│                               SQLAlchemy    │
│                             ┌──────▼──────┐ │
│                             │  SQLite DB  │ │
│                             └─────────────┘ │
└─────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native 0.81, Expo 54, Expo Router 6 |
| Language (FE) | TypeScript 5.9 |
| Language (BE) | Python 3.11+ |
| API Framework | FastAPI |
| ORM | SQLAlchemy 2.0 (async) |
| Database | SQLite (via aiosqlite) |
| Migrations | Alembic |
| Auth | JWT (python-jose), Refresh Tokens, SecureStore |
| Validation | Pydantic v2 |
| Package Mgr (BE) | uv |
| Package Mgr (FE) | npm |

## API Base URL Resolution

The frontend dynamically resolves the backend URL using Metro bundler's host:

```typescript
// frontend/services/api.ts
const host = Constants.expoConfig?.hostUri?.split(':')[0]; // e.g. "192.168.1.3"
const API_BASE = `http://${host}:8000/api/v1`;
```

The backend must be started with `--host 0.0.0.0` to accept LAN connections.

## Authentication Flow

```
Register/Login
  → POST /auth/register or /auth/login
  → Returns { accessToken (15min), refreshToken (30days) }
  → Stored in SecureStore

Authenticated Request
  → Authorization: Bearer <accessToken>
  → On 401: auto-refresh via POST /auth/refresh (rotates refresh token)
  → On refresh failure: logout

Logout
  → DELETE /auth/logout (revokes refresh token in DB)
  → Clears SecureStore
```

## Data Serialization Contract

- **Backend → Frontend**: all response fields are **camelCase** (Pydantic `to_camel` alias generator)
- **Frontend → Backend**: request bodies use camelCase (Pydantic `populate_by_name=True`)
- Special override: `is_system` field aliased as `isDefault` in category responses

## Database Schema (Current)

```
users
  id, name, email, hashed_password, currency, monthly_budget,
  notifications_enabled, theme, created_at, updated_at

refresh_tokens
  id, user_id (FK→users), token_hash, expires_at, revoked, created_at

password_reset_tokens
  id, user_id (FK→users), token_hash, expires_at, used, created_at

categories
  id, name, icon, color, is_system, user_id (FK→users, nullable), created_at
```

## Feature Roadmap

- [x] Auth (register, login, logout, refresh, forgot/reset password)
- [x] User Profile (get, update, delete)
- [x] Categories (system + custom, CRUD)
- [ ] Personal Expenses (CRUD, filter by date/category/type)
- [ ] Groups & Members
- [ ] Group Expenses & Splits
- [ ] Settlements
- [ ] Subscriptions
- [ ] Reports & Analytics
- [ ] Notifications
