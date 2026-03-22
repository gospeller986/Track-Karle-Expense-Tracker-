# API Documentation — Expense Tracker

Full REST API reference for the Expense Tracker & Group Splitting app.
All endpoints are prefixed with `/api/v1`. Authentication uses **JWT Bearer tokens** unless marked `[public]`.

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [User & Profile](#2-user--profile)
3. [Categories](#3-categories)
4. [Personal Expenses](#4-personal-expenses)
5. [Subscriptions](#5-subscriptions)
6. [Groups](#6-groups)
7. [Group Expenses & Splits](#7-group-expenses--splits)
8. [Settlements](#8-settlements)
9. [Reports & Analytics](#9-reports--analytics)
10. [Common Shapes](#10-common-shapes)

---

## 1. Authentication

All auth endpoints are public (no token required).

---

### `POST /auth/register` `[public]`

Create a new account. Returns access + refresh tokens on success.

**Request body**
```json
{
  "name": "Satyajit Pal",
  "email": "sat@example.com",
  "password": "min8chars"
}
```

**Response `201`**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Satyajit Pal",
    "email": "sat@example.com",
    "currency": "INR"
  },
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>"
}
```

---

### `POST /auth/login` `[public]`

Sign in with email and password.

**Request body**
```json
{ "email": "sat@example.com", "password": "mypassword" }
```

**Response `200`** — same shape as register.

---

### `POST /auth/refresh` `[public]`

Exchange a refresh token for a new access/refresh token pair.

**Request body**
```json
{ "refreshToken": "<jwt>" }
```

**Response `200`**
```json
{ "accessToken": "<jwt>", "refreshToken": "<jwt>" }
```

---

### `POST /auth/logout`

Invalidate the current refresh token.

**Request body**
```json
{ "refreshToken": "<jwt>" }
```

**Response `204`** No content.

---

### `POST /auth/forgot-password` `[public]`

Send a password reset link to the given email. Always returns `200` regardless of whether the email exists (prevents enumeration).

**Request body**
```json
{ "email": "sat@example.com" }
```

**Response `200`**
```json
{ "message": "Reset link sent if email exists" }
```

---

### `POST /auth/reset-password` `[public]`

Set a new password using the token from the reset email.

**Request body**
```json
{ "token": "<reset-token>", "newPassword": "newpass123" }
```

**Response `200`**
```json
{ "message": "Password updated successfully" }
```

---

## 2. User & Profile

---

### `GET /users/me`

Get the authenticated user's profile.

**Response `200`**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Satyajit Pal",
  "email": "sat@example.com",
  "avatarUrl": null,
  "currency": "INR",
  "monthlyBudget": 40000,
  "notificationsEnabled": true,
  "theme": "dark",
  "createdAt": "2026-01-15T00:00:00Z"
}
```

---

### `PUT /users/me`

Update profile fields. All fields are optional.

**Request body**
```json
{
  "name": "Satyajit",
  "currency": "INR",
  "monthlyBudget": 45000,
  "notificationsEnabled": false,
  "theme": "dark"
}
```

**Response `200`** — updated user object (same shape as `GET /users/me`).

---

### `DELETE /users/me`

Permanently delete the account and all associated data.

**Response `204`** No content.

---

## 3. Categories

The app ships with **10 system categories** (Food & Dining, Transport, Shopping, Entertainment, Health, Utilities, Rent, Subscriptions, Travel, Other) that cannot be modified or deleted. Users can also create custom categories.

---

### `GET /categories`

List all categories — system defaults plus the user's custom ones.

**Response `200`**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Food & Dining",
      "icon": "🍔",
      "color": "#FF8A00",
      "isSystem": true,
      "userId": null
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Gym",
      "icon": "💪",
      "color": "#00C48C",
      "isSystem": false,
      "userId": "550e8400-e29b-41d4-a716-446655440000"
    }
  ]
}
```

---

### `POST /categories`

Create a custom category.

**Request body**
```json
{ "name": "Gym", "icon": "💪", "color": "#00C48C" }
```

**Response `201`** — created category object.

---

### `PUT /categories/:id`

Update a custom category. System categories (`isSystem: true`) cannot be edited.

**Request body** _(all optional)_
```json
{ "name": "Fitness", "icon": "🏋️", "color": "#00C48C" }
```

**Response `200`** — updated category object.

---

### `DELETE /categories/:id`

Delete a custom category. System categories cannot be deleted.

**Response `204`** No content.

---

## 4. Personal Expenses

---

### `GET /expenses`

List the user's personal expenses with optional filters and pagination.

**Query params**
| Param | Type | Description |
|---|---|---|
| `page` | number | Page number (default `1`) |
| `limit` | number | Items per page (default `20`, max `100`) |
| `type` | `expense \| income` | Filter by transaction type |
| `categoryId` | string | Filter by category ID |
| `startDate` | ISO date `YYYY-MM-DD` | Filter from this date (inclusive) |
| `endDate` | ISO date `YYYY-MM-DD` | Filter to this date (inclusive) |
| `search` | string | Full-text search on title and note |

**Response `200`**
```json
{
  "data": [
    {
      "id": "e_001",
      "title": "Zomato order",
      "amount": 485.0,
      "type": "expense",
      "categoryId": "cat_food",
      "category": {
        "id": "cat_food",
        "name": "Food & Dining",
        "icon": "🍔",
        "color": "#FF8A00"
      },
      "date": "2026-03-19",
      "note": "Lunch with colleagues",
      "createdAt": "2026-03-19T13:35:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 142, "totalPages": 8 }
}
```

---

### `POST /expenses`

Create a new personal expense or income entry.

**Request body**
```json
{
  "title": "Zomato order",
  "amount": 485,
  "type": "expense",
  "categoryId": "cat_food",
  "date": "2026-03-19",
  "note": "Lunch"
}
```

> `type` must be `"expense"` or `"income"`. `amount` must be `> 0`. `note` is optional.

**Response `201`** — created expense object (same shape as list item).

---

### `GET /expenses/:id`

Fetch a single expense by ID.

**Response `200`** — single expense object.
**Response `404`** if not found or not owned by the current user.

---

### `PUT /expenses/:id`

Update an expense. All body fields are optional; only provided fields are changed.

**Request body**
```json
{
  "title": "Updated title",
  "amount": 500,
  "type": "expense",
  "categoryId": "cat_transport",
  "date": "2026-03-20",
  "note": "Updated note"
}
```

**Response `200`** — updated expense object.

---

### `DELETE /expenses/:id`

Delete an expense.

**Response `204`** No content.

---

## 5. Subscriptions

---

### `GET /subscriptions`

List all subscriptions for the user, plus a cost summary.

**Response `200`**
```json
{
  "data": [
    {
      "id": "sub_001",
      "name": "Netflix",
      "icon": "🎬",
      "color": "#E50914",
      "amount": 649.0,
      "cycle": "monthly",
      "category": "Entertainment",
      "nextRenewal": "2026-03-28",
      "isActive": true,
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ],
  "summary": {
    "monthlyTotal": 2932.0,
    "yearlyTotal": 35184.0,
    "count": 7
  }
}
```

> `cycle` values: `"weekly"`, `"monthly"`, `"yearly"`.
> `summary.monthlyTotal` normalises all cycles to a per-month cost.

---

### `POST /subscriptions`

Create a new subscription tracker entry.

**Request body**
```json
{
  "name": "Netflix",
  "icon": "🎬",
  "color": "#E50914",
  "amount": 649,
  "cycle": "monthly",
  "category": "Entertainment",
  "nextRenewal": "2026-03-28"
}
```

**Response `201`** — created subscription object.

---

### `GET /subscriptions/:id`

Get a single subscription.

**Response `200`** — subscription object.

---

### `PUT /subscriptions/:id`

Update a subscription (e.g. after a price change). All fields are optional.

**Response `200`** — updated subscription object.

---

### `DELETE /subscriptions/:id`

Remove (untrack) a subscription.

**Response `204`** No content.

---

## 6. Groups

---

### `GET /groups`

List all groups the user is a member of.

**Response `200`**
```json
{
  "data": [
    {
      "id": "g_001",
      "name": "Goa Trip",
      "icon": "🌊",
      "description": "March 2026 trip",
      "createdBy": "u_123",
      "memberCount": 4,
      "totalExpenses": 24600.0,
      "yourBalance": 3200.0,
      "members": [
        { "id": "u_123", "name": "Satyajit", "initials": "SP", "avatarUrl": null },
        { "id": "u_456", "name": "Aryan",    "initials": "AR", "avatarUrl": null }
      ],
      "createdAt": "2026-03-01T00:00:00Z"
    }
  ]
}
```

> `yourBalance`: positive = others owe you, negative = you owe others.

---

### `POST /groups`

Create a new group. The creator is automatically added as admin.

**Request body**
```json
{
  "name": "Goa Trip",
  "icon": "🌊",
  "description": "March 2026"
}
```

> `icon` and `description` are optional.

**Response `201`** — created group object.

---

### `GET /groups/:id`

Get full group details including all members.

**Response `200`** — group object (same shape as list item).
**Response `404`** if the group doesn't exist or the user is not a member.

---

### `PUT /groups/:id`

Update a group's name, icon, or description. Only the group creator can do this.

**Request body** _(all optional)_
```json
{ "name": "Goa 2026", "icon": "🏖️", "description": "Updated" }
```

**Response `200`** — updated group object.

---

### `DELETE /groups/:id`

Delete a group and all its expenses and settlements. Only the creator can delete.

**Response `204`** No content.

---

### `POST /groups/:id/generate-invite`

Generate (or regenerate) a unique invite link for the group.

**Response `200`**
```json
{
  "inviteToken": "abc123xyz",
  "inviteLink": "https://<host>/join/abc123xyz",
  "groupId": "g_001",
  "groupName": "Goa Trip"
}
```

---

### `POST /groups/join`

Join a group using an invite token (scanned from QR or tapped from a link).

**Request body**
```json
{ "token": "abc123xyz" }
```

**Response `200`** — joined group object.
**Response `404`** if the token is invalid.
**Response `409`** if the user is already a member.

---

### `GET /groups/friends/list`

List all unique users who share at least one group with the current user, along with the net balance across all shared groups.

**Response `200`**
```json
{
  "data": [
    {
      "id": "u_456",
      "name": "Aryan",
      "initials": "AR",
      "avatarUrl": null,
      "netBalance": 2850.0,
      "sharedGroups": 2
    }
  ]
}
```

---

## 7. Group Expenses & Splits

All group expense endpoints are nested under a group:
`/groups/:groupId/expenses`

---

### `GET /groups/:groupId/expenses`

List all expenses for a group, ordered by date descending.

**Response `200`**
```json
{
  "data": [
    {
      "id": "ge_001",
      "groupId": "g_001",
      "title": "Hotel Taj",
      "amount": 12000.0,
      "categoryId": "cat_travel",
      "category": { "id": "cat_travel", "name": "Travel", "icon": "✈️", "color": "#00B4D8" },
      "paidBy": "u_123",
      "splitType": "equal",
      "splits": [
        { "userId": "u_123", "amount": 3000.0, "percentage": 25.0, "isSettled": false },
        { "userId": "u_456", "amount": 3000.0, "percentage": 25.0, "isSettled": false }
      ],
      "isSettled": false,
      "note": "2 nights stay",
      "date": "2026-03-10",
      "createdAt": "2026-03-10T12:00:00Z"
    }
  ]
}
```

---

### `POST /groups/:groupId/expenses`

Add a new expense to the group with split details.

**Request body — Equal split**
```json
{
  "title": "Hotel Taj",
  "amount": 12000,
  "categoryId": "cat_travel",
  "paidBy": "u_123",
  "splitType": "equal",
  "date": "2026-03-10",
  "note": "2 nights stay"
}
```

**Request body — Unequal split**
```json
{
  "title": "Beach shack dinner",
  "amount": 3400,
  "categoryId": "cat_food",
  "paidBy": "u_456",
  "splitType": "unequal",
  "splits": [
    { "userId": "u_123", "amount": 1200 },
    { "userId": "u_456", "amount": 800  },
    { "userId": "u_789", "amount": 900  },
    { "userId": "u_012", "amount": 500  }
  ],
  "date": "2026-03-11"
}
```

**Request body — Percentage split**
```json
{
  "title": "Scuba diving",
  "amount": 5600,
  "categoryId": "cat_entertainment",
  "paidBy": "u_789",
  "splitType": "percentage",
  "splits": [
    { "userId": "u_123", "percentage": 40 },
    { "userId": "u_456", "percentage": 30 },
    { "userId": "u_789", "percentage": 20 },
    { "userId": "u_012", "percentage": 10 }
  ],
  "date": "2026-03-12"
}
```

**Validation rules:**
- `unequal`: `splits[].amount` must sum exactly to `amount`.
- `percentage`: `splits[].percentage` must sum exactly to `100`.
- `paidBy` must be a member of the group.
- For `equal` splits, all current group members are included automatically.

**Response `201`** — created group expense object.

---

### `DELETE /groups/:groupId/expenses/:expenseId`

Delete a group expense. Only the expense creator or the group creator can delete.

**Response `204`** No content.

---

## 8. Settlements

---

### `GET /groups/:groupId/balances`

Get the simplified net balance summary for the group — who owes who, minimised to the fewest transactions needed to fully settle.

**Response `200`**
```json
{
  "balances": [
    {
      "from": { "id": "u_456", "name": "Aryan" },
      "to":   { "id": "u_123", "name": "Satyajit" },
      "amount": 2850.0
    },
    {
      "from": { "id": "u_012", "name": "Karan" },
      "to":   { "id": "u_123", "name": "Satyajit" },
      "amount": 1400.0
    }
  ],
  "yourBalance": 4250.0
}
```

---

### `POST /groups/:groupId/settle`

Record a payment between two members to settle (part of) a balance.

**Request body**
```json
{
  "payeeId": "u_123",
  "amount": 2850,
  "note": "GPay payment",
  "date": "2026-03-20"
}
```

> `payeeId` is the person being paid. `note` and `date` are optional (date defaults to today).

**Response `201`**
```json
{
  "id": "s_001",
  "groupId": "g_001",
  "payerId": "u_456",
  "payeeId": "u_123",
  "amount": 2850.0,
  "note": "GPay payment",
  "date": "2026-03-20",
  "createdAt": "2026-03-20T10:00:00Z"
}
```

---

## 9. Reports & Analytics

All report endpoints default to the **current month/week** when no date params are provided.

---

### `GET /reports/summary`

Monthly totals for the current user — income, expenses, net balance, and key stats.

**Query params**
| Param | Type | Description |
|---|---|---|
| `year` | number | Year (default: current year) |
| `month` | number | Month 1–12 (default: current month) |

**Response `200`**
```json
{
  "totalIncome": 110000.0,
  "totalExpenses": 30820.0,
  "netBalance": 79180.0,
  "transactionCount": 18,
  "avgDailySpend": 993.55,
  "largestExpense": {
    "title": "House rent",
    "amount": 22000.0
  },
  "year": 2026,
  "month": 3
}
```

---

### `GET /reports/spending-trend`

Monthly expense and income totals for the past N months (used for bar charts).

**Query params**
| Param | Type | Description |
|---|---|---|
| `months` | number | How many months back (default `6`, max `24`) |

**Response `200`**
```json
{
  "data": [
    { "month": "Oct", "year": 2025, "totalIncome": 95000.0, "totalExpenses": 28400.0 },
    { "month": "Nov", "year": 2025, "totalIncome": 95000.0, "totalExpenses": 31200.0 },
    { "month": "Mar", "year": 2026, "totalIncome": 110000.0, "totalExpenses": 30820.0 }
  ]
}
```

> Months with zero activity are still included in the response with `0.0` values, so the array always has exactly `months` items.

---

### `GET /reports/weekly-trend`

Expense and income totals for the past N calendar weeks (Mon–Sun), used for weekly bar charts.

**Query params**
| Param | Type | Description |
|---|---|---|
| `weeks` | number | How many weeks back (default `4`, max `12`) |

**Response `200`**
```json
{
  "data": [
    { "weekStart": "2026-03-02", "label": "Mar 2",  "totalIncome": 0.0,     "totalExpenses": 4200.0 },
    { "weekStart": "2026-03-09", "label": "Mar 9",  "totalIncome": 0.0,     "totalExpenses": 6800.0 },
    { "weekStart": "2026-03-16", "label": "Mar 16", "totalIncome": 110000.0, "totalExpenses": 3174.0 },
    { "weekStart": "2026-03-23", "label": "Mar 23", "totalIncome": 0.0,     "totalExpenses": 1240.0 }
  ]
}
```

> Weeks are anchored to Monday. The current (partial) week is always the last item. All 4 weeks are always returned even if empty.

---

### `GET /reports/category-breakdown`

Expense breakdown by category for a given month, sorted by amount descending.

**Query params**
| Param | Type | Description |
|---|---|---|
| `year` | number | Year (default: current year) |
| `month` | number | Month 1–12 (default: current month) |

**Response `200`**
```json
{
  "data": [
    {
      "categoryId": "cat_rent",
      "name": "Rent",
      "icon": "🏠",
      "color": "#FF6B6B",
      "amount": 22000.0,
      "percentage": 71.4,
      "transactionCount": 1
    },
    {
      "categoryId": "cat_food",
      "name": "Food & Dining",
      "icon": "🍔",
      "color": "#FF8A00",
      "amount": 3475.0,
      "percentage": 11.3,
      "transactionCount": 4
    }
  ],
  "year": 2026,
  "month": 3
}
```

> Only categories with at least one expense in the period are included. `percentage` values sum to `100`.

---

## 10. Common Shapes

### Error response

All error responses follow this structure:

```json
{
  "detail": {
    "code": "NOT_FOUND",
    "message": "Expense not found."
  }
}
```

**Error codes used:**
| Code | Meaning |
|---|---|
| `VALIDATION_ERROR` | Request body failed validation |
| `NOT_FOUND` | Resource doesn't exist or not accessible by the current user |
| `ALREADY_EXISTS` | Duplicate — e.g. email already registered |
| `INVALID_TOKEN` | JWT is expired, malformed, or revoked |
| `FORBIDDEN` | Valid token but insufficient permissions |

---

### HTTP status codes

| Code | Meaning |
|---|---|
| `200` | OK |
| `201` | Created |
| `204` | No Content (successful delete/logout) |
| `400` | Bad Request / Validation Error |
| `401` | Unauthorized — missing or invalid access token |
| `403` | Forbidden — valid token but not allowed |
| `404` | Resource not found |
| `409` | Conflict — e.g. already a group member |
| `422` | Unprocessable Entity — e.g. split amounts don't add up |
| `500` | Internal Server Error |

---

### Pagination object

Returned by any list endpoint that supports `page` / `limit` params.

```json
{
  "page": 1,
  "limit": 20,
  "total": 142,
  "totalPages": 8
}
```

---

### Authentication header

All protected endpoints require:

```
Authorization: Bearer <accessToken>
```

Access tokens expire in **15 minutes**. Use `POST /auth/refresh` with the refresh token (valid for **30 days**) to get a new access/refresh token pair.

---

### Token fields — camelCase

All JSON field names in both requests and responses use **camelCase** (e.g. `categoryId`, `totalExpenses`, `nextRenewal`). The backend applies a `to_camel` alias generator globally.
