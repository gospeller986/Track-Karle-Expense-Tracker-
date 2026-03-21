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
                                    │ HTTP/JSON (LAN IP, port 8000)
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
| QR Generation | react-native-qrcode-svg |
| QR Scanning | expo-camera (CameraView + onBarcodeScanned) |
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
  → POST /api/v1/auth/register or /api/v1/auth/login
  → Returns { accessToken (15min), refreshToken (30days) }
  → Stored in SecureStore

Authenticated Request
  → Authorization: Bearer <accessToken>
  → On 401: auto-refresh via POST /api/v1/auth/refresh (rotates refresh token)
  → On refresh failure: logout

Logout
  → DELETE /api/v1/auth/logout (revokes refresh token in DB)
  → Clears SecureStore
```

## Deep Linking

App URL scheme: **`exptracker`** (configured in `frontend/app.json`)

| URL | Handler |
|-----|---------|
| `exptracker://join/<token>` | `app/join/[token].tsx` |

**Group Invite Flow:**
1. Group member opens Invite screen → backend generates `POST /api/v1/groups/:id/generate-invite`
2. Frontend renders QR encoding `exptracker://join/<token>`
3. Recipient opens Groups tab → taps QR icon → in-app scanner (`app/group/scan.tsx`)
4. Scanner parses token → calls `POST /api/v1/groups/join` → navigates to group

**`parseToken` in `scan.tsx` handles all QR formats:**
- `exptracker://join/<token>` — hostname=`join`, token in pathname
- `http(s)://<host>/join/<token>` — token after `join` in path
- Raw token string (≥10 alphanumeric chars)

**HTTP Redirect Fallback** (`GET /join/{token}` at root, not under `/api/v1`):
Tries `exptracker://` first, then `exp://<host>:8081/--/join/<token>` (Expo Go) after 800ms.

## Data Serialization Contract

- **Backend → Frontend**: all response fields are **camelCase** (Pydantic `to_camel` alias generator)
- **Frontend → Backend**: request bodies use camelCase
- All routers use `response_model_by_alias=True`
- Special override: `is_system` aliased as `isDefault` in category responses

## API Routes

| Prefix | File | Key Endpoints |
|--------|------|---------------|
| `/api/v1/auth` | `routes/auth.py` | register, login, logout, refresh, forgot-password, reset-password |
| `/api/v1/users` | `routes/users.py` | profile get/update/delete |
| `/api/v1/categories` | `routes/categories.py` | list, create, update, delete |
| `/api/v1/expenses` | `routes/expenses.py` | CRUD, filter by date/category/type |
| `/api/v1/subscriptions` | `routes/subscriptions.py` | CRUD |
| `/api/v1/groups` | `routes/groups.py` | CRUD, generate-invite, join, friends/list |
| `/join/{token}` | `main.py` | HTML redirect page for deep link fallback |

## Database Schema (Current)

```
users
  id, name, email, hashed_password, avatar_url, currency, monthly_budget,
  notifications_enabled, theme, created_at, updated_at

refresh_tokens
  id, user_id (FK→users), token_hash, expires_at, revoked, created_at

password_reset_tokens
  id, user_id (FK→users), token_hash, expires_at, used, created_at

categories
  id, name, icon, color, is_system, user_id (FK→users, nullable), created_at

expenses
  id, user_id (FK→users), category_id (FK→categories), title, amount,
  type (expense|income), date, notes, created_at, updated_at

subscriptions
  id, user_id (FK→users), name, amount, category, billing_cycle,
  next_renewal, is_active, created_at, updated_at

groups
  id, name, icon, description, created_by (FK→users), invite_token (unique),
  created_at, updated_at

group_members
  id, group_id (FK→groups, CASCADE), user_id (FK→users), role (admin|member),
  joined_at

group_expenses
  id, group_id (FK→groups), paid_by (FK→users), title, amount, split_type,
  date, created_at

group_expense_splits
  id, expense_id (FK→group_expenses), user_id (FK→users), amount

settlements
  id, group_id (FK→groups), paid_by (FK→users), paid_to (FK→users),
  amount, settled_at
```

## Alembic Migrations

| Revision | Description |
|----------|-------------|
| 0001 | Initial schema (users, refresh_tokens, password_reset_tokens, categories) |
| 0002 | Add expenses, subscriptions |
| 0003 | Add invite_token column to groups |

**Note:** Group tables (groups, group_members, group_expenses, group_expense_splits, settlements)
were created by `create_tables()` before migrations covered them. Migration 0003 only adds
the `invite_token` column; the other group tables are not in any migration.

## Feature Roadmap

- [x] Auth (register, login, logout, refresh, forgot/reset password)
- [x] User Profile (get, update, delete)
- [x] Categories (system + custom, CRUD)
- [x] Personal Expenses (CRUD, filter by date/category/type)
- [x] Subscriptions (CRUD, date picker, auto-icon from category)
- [x] Groups (create, list, detail, delete)
- [x] Group Invites (QR code, in-app scanner, deep link, share via iMessage)
- [x] Implicit Friends (derived from group co-membership, no separate model)
- [ ] Group Expenses & Splits (equal / unequal / percentage)
- [ ] Settlement Recording & Balance Computation
- [ ] Reports & Analytics
- [ ] Notifications
