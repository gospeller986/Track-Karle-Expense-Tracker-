# Expense Tracker

A full-stack personal finance app built with React Native and FastAPI. Track personal expenses and income, manage group bills with friends, monitor subscriptions, and analyse spending through a reports dashboard — all with a dark-themed mobile-first UI.

---

## Tech Stack

### Frontend
| Technology | Role |
|---|---|
| **React Native** | Cross-platform mobile UI |
| **Expo** (Expo Go / Expo Router) | Dev toolchain, file-based navigation, deep links |
| **TypeScript** | Static typing throughout |
| **expo-linear-gradient** | Gradient cards and bar charts |
| **expo-secure-store** | Secure JWT token storage on-device |
| **react-native-safe-area-context** | Safe area insets on notch/gesture-bar devices |

### Backend
| Technology | Role |
|---|---|
| **FastAPI** | Async REST API framework |
| **SQLAlchemy** (async) | ORM with async engine |
| **SQLite** | Embedded database |
| **Alembic** | Schema migrations |
| **Pydantic v2** | Request/response validation, camelCase aliasing |
| **Python-Jose / Passlib** | JWT signing, bcrypt password hashing |

---

## Project Structure

```
expense_tracker/
├── backend/
│   ├── models/          SQLAlchemy ORM models
│   ├── repository/      Data access layer (queries)
│   ├── routes/          FastAPI route handlers
│   ├── schemas/         Pydantic request/response schemas
│   ├── migrations/      Alembic migration scripts
│   ├── database.py      Async session factory
│   ├── config.py        App settings
│   └── main.py          App entry point + router registration
│
├── frontend/
│   ├── app/             Expo Router screens
│   │   ├── (tabs)/      Tab navigator screens (Home, Expenses, Groups, Subscriptions, Reports)
│   │   ├── auth/        Login, register, forgot/reset password
│   │   ├── expense/     Add & view expense modals
│   │   ├── group/       Group creation, details, add expense, invite, settle
│   │   ├── subscription/ Add & view subscription modals
│   │   └── profile/     User profile screen
│   ├── components/      Shared UI components (Card, Badge, TabBar, home sub-components)
│   ├── hooks/           Data-fetching hooks (useExpenses, useGroups, useReports, …)
│   ├── services/        API service functions (one file per domain)
│   ├── interfaces/      TypeScript interfaces (object shapes / API contracts)
│   ├── types/           TypeScript primitive types and unions
│   └── constants/       Theme, utilities (formatCurrency, formatDate, …)
│
└── docs/
    ├── api-documentation.md
    ├── architecture.md
    ├── backend.md
    └── frontend.md
```

---

## Core Features

### Personal Expense Tracking
- Log expenses and income with amount, category, date, and note
- Filter by type (expense/income), category, date range, or keyword search
- Paginated transaction list with full-text search
- 10 built-in system categories; create unlimited custom categories with custom icon and colour

### Home Dashboard
- **Net balance card** — current month income vs. spent, with budget progress bar
- **6-month spending trend** — bar chart showing monthly expense history
- **Recent transactions** — last 5 expenses with one-tap navigation
- **Renewing soon** — subscriptions due within 7 days
- **Group balances** — groups where you have an outstanding balance

### Group Bill Splitting
- Create groups (trips, households, events) with emoji icons
- Invite members via shareable QR code / deep link
- Add group expenses with three split modes:
  - **Equal** — divided evenly across all members
  - **Unequal** — specify exact amounts per person
  - **Percentage** — specify percentage shares (must total 100%)
- Simplified balance view — minimum transactions needed to fully settle
- Record settlements between any two members

### Subscription Tracker
- Track recurring bills (weekly, monthly, yearly billing cycles)
- Dashboard summary: monthly equivalent total, yearly total, active count
- Renewal alerts on the home screen for subscriptions due within 7 days

### Reports & Analytics
- **Monthly view** — total spent, avg per day, largest expense, transaction count
- **6-month bar chart** — spending trend over the last 6 months
- **Weekly view** — past 4 calendar weeks (Mon–Sun) shown as a bar chart with delta vs. prior week
- **Category breakdown** — horizontal progress bars showing spend by category with percentages

### Authentication
- Email + password registration and login
- JWT access tokens (15-minute expiry) + refresh tokens (30-day expiry)
- Password reset via emailed token

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Expo Go app on your phone (iOS or Android), on the same WiFi network as your dev machine

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Apply database migrations
alembic upgrade head

# Start the server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://<your-local-ip>:8000`.
Interactive docs: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npx expo start
```

Scan the QR code with Expo Go. The app auto-discovers the backend IP from Expo's `hostUri` — no hardcoding needed.

---

## Database Migrations

Schema changes are managed with Alembic. **Never recreate the database manually.**

```bash
cd backend

# Generate a migration after changing a model
alembic revision --autogenerate -m "describe the change"

# Apply pending migrations
alembic upgrade head

# Roll back one migration
alembic downgrade -1
```

---

## API Reference

See [docs/api-documentation.md](docs/api-documentation.md) for the full REST API specification.

---

## Architecture

See [docs/architecture.md](docs/architecture.md) for the system diagram and layer responsibilities.
