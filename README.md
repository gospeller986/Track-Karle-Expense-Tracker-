# Expense Tracker — API Reference

Full REST API specification for the Expense Tracker & Group Splitting app.
All endpoints are prefixed with `/api/v1`. Authentication uses **JWT Bearer tokens** unless marked `[public]`.

---

## Table of Contents

1. [Auth](#1-auth)
2. [User & Profile](#2-user--profile)
3. [Personal Expenses](#3-personal-expenses)
4. [Categories](#4-categories)
5. [Groups](#5-groups)
6. [Group Members](#6-group-members)
7. [Group Expenses & Splits](#7-group-expenses--splits)
8. [Settlements](#8-settlements)
9. [Friends & Contacts](#9-friends--contacts)
10. [Subscriptions](#10-subscriptions)
11. [Reports & Analytics](#11-reports--analytics)
12. [Notifications](#12-notifications)
13. [Common Shapes](#13-common-shapes)

---

## 1. Auth

### `POST /auth/register` `[public]`
Create a new account.

**Request body**
```json
{
  "name": "Satyajit Pal",
  "email": "sat@example.com",
  "password": "min8chars",
  "currency": "INR"          // optional, default "INR"
}
```

**Response `201`**
```json
{
  "user": { "id": "u_123", "name": "Satyajit Pal", "email": "sat@example.com", "currency": "INR" },
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>"
}
```

---

### `POST /auth/login` `[public]`
Sign in with email + password.

**Request body**
```json
{ "email": "sat@example.com", "password": "mypassword" }
```

**Response `200`**
```json
{
  "user": { "id": "u_123", "name": "Satyajit Pal", "email": "sat@example.com" },
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>"
}
```

---

### `POST /auth/refresh` `[public]`
Exchange a refresh token for a new access token.

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
Send a password reset OTP/link to the user's email.

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
Set a new password using the OTP received by email.

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

### `GET /users/me`
Get the authenticated user's profile.

**Response `200`**
```json
{
  "id": "u_123",
  "name": "Satyajit Pal",
  "email": "sat@example.com",
  "avatarUrl": "https://cdn.example.com/avatars/u_123.jpg",
  "currency": "INR",
  "monthlyBudget": 40000,
  "notificationsEnabled": true,
  "theme": "dark",
  "createdAt": "2026-01-15T00:00:00Z"
}
```

---

### `PUT /users/me`
Update profile details.

**Request body** _(all fields optional)_
```json
{
  "name": "Satyajit",
  "currency": "INR",
  "monthlyBudget": 45000,
  "notificationsEnabled": false,
  "theme": "light"
}
```

**Response `200`** — updated user object (same shape as `GET /users/me`).

---

### `PUT /users/me/avatar`
Upload a profile photo. Multipart form data.

**Request** `Content-Type: multipart/form-data`
```
file: <image binary>
```

**Response `200`**
```json
{ "avatarUrl": "https://cdn.example.com/avatars/u_123.jpg" }
```

---

### `DELETE /users/me`
Permanently delete the account and all associated data.

**Response `204`** No content.

---

## 3. Personal Expenses

### `GET /expenses`
List the user's personal expenses with filters and pagination.

**Query params**
| Param | Type | Description |
|---|---|---|
| `page` | number | Page number (default 1) |
| `limit` | number | Items per page (default 20, max 100) |
| `type` | `expense\|income` | Filter by transaction type |
| `categoryId` | string | Filter by category |
| `startDate` | ISO date | Filter from date (inclusive) |
| `endDate` | ISO date | Filter to date (inclusive) |
| `search` | string | Full-text search on title/note |

**Response `200`**
```json
{
  "data": [
    {
      "id": "e_001",
      "title": "Zomato order",
      "amount": 485,
      "type": "expense",
      "categoryId": "cat_food",
      "category": { "id": "cat_food", "name": "Food & Dining", "icon": "🍔", "color": "#FF8A00" },
      "date": "2026-03-19T13:30:00Z",
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
  "date": "2026-03-19T13:30:00Z",
  "note": "Lunch"               // optional
}
```

**Response `201`** — created expense object.

---

### `GET /expenses/:id`
Fetch a single expense by ID.

**Response `200`** — single expense object (same shape as list item).

---

### `PUT /expenses/:id`
Update an expense. All body fields are optional.

**Request body**
```json
{
  "title": "Updated title",
  "amount": 500,
  "categoryId": "cat_transport",
  "date": "2026-03-19T14:00:00Z",
  "note": "Updated note"
}
```

**Response `200`** — updated expense object.

---

### `DELETE /expenses/:id`
Delete an expense.

**Response `204`** No content.

---

## 4. Categories

### `GET /categories`
List all categories (system defaults + user custom ones).

**Response `200`**
```json
{
  "data": [
    { "id": "cat_food", "name": "Food & Dining", "icon": "🍔", "color": "#FF8A00", "isDefault": true },
    { "id": "cat_custom_1", "name": "My Category", "icon": "🎯", "color": "#C9F31D", "isDefault": false }
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
Update a custom category (cannot update system defaults).

**Response `200`** — updated category.

---

### `DELETE /categories/:id`
Delete a custom category. Expenses using it fall back to "Other".

**Response `204`** No content.

---

## 5. Groups

### `GET /groups`
List all groups the user belongs to, with their own balance in each.

**Response `200`**
```json
{
  "data": [
    {
      "id": "g_001",
      "name": "Goa Trip",
      "icon": "🌊",
      "description": "March 2026 trip",
      "memberCount": 4,
      "totalExpenses": 24600,
      "yourBalance": 3200,      // positive = owed to you, negative = you owe
      "createdAt": "2026-03-01T00:00:00Z",
      "members": [
        { "id": "u_123", "name": "You", "initials": "YO", "avatarUrl": null },
        { "id": "u_456", "name": "Aryan", "initials": "AR", "avatarUrl": null }
      ]
    }
  ]
}
```

---

### `POST /groups`
Create a new group.

**Request body**
```json
{
  "name": "Goa Trip",
  "icon": "🌊",
  "description": "March 2026",   // optional
  "memberEmails": ["aryan@x.com", "priya@x.com"]   // optional — invite on creation
}
```

**Response `201`**
```json
{
  "id": "g_001",
  "name": "Goa Trip",
  "icon": "🌊",
  "inviteLink": "https://app.example.com/join/abc123",
  "members": [ ... ]
}
```

---

### `GET /groups/:id`
Get full group detail.

**Response `200`**
```json
{
  "id": "g_001",
  "name": "Goa Trip",
  "icon": "🌊",
  "description": "March 2026 trip",
  "totalExpenses": 24600,
  "yourBalance": 3200,
  "members": [
    {
      "id": "u_123",
      "name": "You",
      "initials": "YO",
      "avatarUrl": null,
      "netBalance": 3200,        // positive = others owe them
      "totalPaid": 12000
    }
  ],
  "createdAt": "2026-03-01T00:00:00Z"
}
```

---

### `PUT /groups/:id`
Update group name, icon, or description. Only the group creator can do this.

**Request body**
```json
{ "name": "Goa 2026", "icon": "🏖️", "description": "Updated desc" }
```

**Response `200`** — updated group object.

---

### `DELETE /groups/:id`
Delete a group. Only the creator can delete; all expenses and settlements are also deleted.

**Response `204`** No content.

---

### `GET /groups/:id/invite-link`
Generate or refresh the group's invite link.

**Response `200`**
```json
{ "inviteLink": "https://app.example.com/join/xyz789", "expiresAt": "2026-04-20T00:00:00Z" }
```

---

### `POST /groups/join`
Join a group via invite link token.

**Request body**
```json
{ "token": "xyz789" }
```

**Response `200`** — joined group object.

---

## 6. Group Members

### `POST /groups/:id/members`
Invite a member to the group by email. Sends them an invite notification.

**Request body**
```json
{ "email": "newmember@example.com" }
```

**Response `201`**
```json
{
  "status": "invited",
  "email": "newmember@example.com",
  "message": "Invite sent. They'll appear once they accept."
}
```

---

### `DELETE /groups/:id/members/:memberId`
Remove a member from the group. Only the group creator or the member themselves can do this.
Blocked if the member has unsettled balances.

**Response `204`** No content.

---

### `GET /groups/:id/members/:memberId/balance`
Get detailed balance breakdown between the current user and a specific member.

**Response `200`**
```json
{
  "memberId": "u_456",
  "memberName": "Aryan",
  "netBalance": 850,
  "youOwe": 0,
  "theyOwe": 850,
  "breakdown": [
    { "expenseId": "ge_001", "expenseTitle": "Hotel Taj", "yourShare": 3000, "theirShare": 3000 }
  ]
}
```

---

## 7. Group Expenses & Splits

### `GET /groups/:id/expenses`
List all expenses for a group.

**Query params**
| Param | Type | Description |
|---|---|---|
| `settled` | boolean | Filter settled / unsettled |
| `paidBy` | string | Filter by who paid |
| `page` | number | Pagination |
| `limit` | number | Items per page |

**Response `200`**
```json
{
  "data": [
    {
      "id": "ge_001",
      "groupId": "g_001",
      "title": "Hotel Taj",
      "amount": 12000,
      "categoryId": "cat_travel",
      "category": { "id": "cat_travel", "name": "Travel", "icon": "✈️", "color": "#00B4D8" },
      "paidBy": {
        "id": "u_123",
        "name": "You"
      },
      "splitType": "equal",
      "splitWith": ["u_123", "u_456", "u_789", "u_012"],
      "splits": [
        { "memberId": "u_123", "memberName": "You",   "amount": 3000, "percentage": 25, "settled": false },
        { "memberId": "u_456", "memberName": "Aryan", "amount": 3000, "percentage": 25, "settled": false },
        { "memberId": "u_789", "memberName": "Priya", "amount": 3000, "percentage": 25, "settled": true  },
        { "memberId": "u_012", "memberName": "Karan", "amount": 3000, "percentage": 25, "settled": false }
      ],
      "yourShare": 3000,
      "note": "2 nights stay",
      "date": "2026-03-10T00:00:00Z",
      "settled": false,
      "createdAt": "2026-03-10T12:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 6, "totalPages": 1 }
}
```

---

### `POST /groups/:id/expenses`
Add a new expense to the group with split details.

**Request body — Equal split**
```json
{
  "title": "Hotel Taj",
  "amount": 12000,
  "categoryId": "cat_travel",
  "paidBy": "u_123",
  "splitType": "equal",
  "splitWith": ["u_123", "u_456", "u_789", "u_012"],
  "date": "2026-03-10T00:00:00Z",
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
  "splitWith": ["u_123", "u_456", "u_789", "u_012"],
  "splits": [
    { "memberId": "u_123", "amount": 1200 },
    { "memberId": "u_456", "amount": 800  },
    { "memberId": "u_789", "amount": 900  },
    { "memberId": "u_012", "amount": 500  }
  ],
  "date": "2026-03-11T00:00:00Z"
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
  "splitWith": ["u_123", "u_456", "u_789", "u_012"],
  "splits": [
    { "memberId": "u_123", "percentage": 40 },
    { "memberId": "u_456", "percentage": 30 },
    { "memberId": "u_789", "percentage": 20 },
    { "memberId": "u_012", "percentage": 10 }
  ],
  "date": "2026-03-12T00:00:00Z"
}
```

**Validation rules:**
- `unequal`: `splits[].amount` must sum exactly to `amount`
- `percentage`: `splits[].percentage` must sum exactly to `100`
- `paidBy` must be a member of the group
- `splitWith` must be a non-empty subset of group members

**Response `201`** — created expense object (same shape as list item).

---

### `GET /groups/:id/expenses/:expenseId`
Get a single group expense with full split detail.

**Response `200`** — single expense object (same shape as list item).

---

### `PUT /groups/:id/expenses/:expenseId`
Edit a group expense. Recalculates splits if amount or split config changes.
Blocked if the expense is already fully settled.

**Request body** — same optional fields as POST.

**Response `200`** — updated expense object.

---

### `DELETE /groups/:id/expenses/:expenseId`
Delete a group expense. Only the creator or group admin can delete.
Blocked if any share is already settled (has associated payments).

**Response `204`** No content.

---

## 8. Settlements

### `GET /groups/:id/balances`
Simplified net balances — who owes who within the group (minimum transactions to settle up).

**Response `200`**
```json
{
  "balances": [
    {
      "from": { "id": "u_456", "name": "Aryan" },
      "to":   { "id": "u_123", "name": "You"   },
      "amount": 2850
    },
    {
      "from": { "id": "u_012", "name": "Karan" },
      "to":   { "id": "u_123", "name": "You"   },
      "amount": 1400
    }
  ]
}
```

---

### `POST /groups/:id/settlements`
Record a payment (settle up) between two members.

**Request body**
```json
{
  "fromMemberId": "u_456",
  "toMemberId":   "u_123",
  "amount": 2850,
  "note": "GPay payment",           // optional
  "date": "2026-03-20T00:00:00Z"   // optional, defaults to now
}
```

**Response `201`**
```json
{
  "id": "s_001",
  "groupId": "g_001",
  "from": { "id": "u_456", "name": "Aryan" },
  "to":   { "id": "u_123", "name": "You"   },
  "amount": 2850,
  "note": "GPay payment",
  "date": "2026-03-20T00:00:00Z",
  "createdAt": "2026-03-20T10:00:00Z"
}
```

---

### `GET /groups/:id/settlements`
List all settlement payments in the group.

**Query params:** `page`, `limit`, `fromMemberId`, `toMemberId`

**Response `200`**
```json
{
  "data": [
    {
      "id": "s_001",
      "from": { "id": "u_456", "name": "Aryan" },
      "to":   { "id": "u_123", "name": "You"   },
      "amount": 2850,
      "note": "GPay payment",
      "date": "2026-03-20T00:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 3, "totalPages": 1 }
}
```

---

### `DELETE /groups/:id/settlements/:settlementId`
Undo a settlement. Only possible within 24 hours of creation.

**Response `204`** No content.

---

## 9. Friends & Contacts

### `GET /friends`
List all accepted friends with net balance across all shared groups.

**Response `200`**
```json
{
  "data": [
    {
      "id": "u_456",
      "name": "Aryan",
      "email": "aryan@example.com",
      "avatarUrl": null,
      "netBalance": 2850,    // positive = they owe you
      "sharedGroups": 2
    }
  ]
}
```

---

### `POST /friends/invite`
Send a friend invite by email. Creates a pending friendship.

**Request body**
```json
{ "email": "friend@example.com", "name": "Aryan" }
```

**Response `201`**
```json
{ "status": "invited", "email": "friend@example.com" }
```

---

### `POST /friends/accept`
Accept a friend invite using the invite token from the email link.

**Request body**
```json
{ "token": "<invite-token>" }
```

**Response `200`** — new friend object.

---

### `DELETE /friends/:friendId`
Remove a friend. Blocked if there are unsettled balances between you.

**Response `204`** No content.

---

### `GET /friends/:friendId/balances`
Detailed cross-group balance breakdown with a specific friend.

**Response `200`**
```json
{
  "friend": { "id": "u_456", "name": "Aryan" },
  "netBalance": 2850,
  "groups": [
    {
      "groupId": "g_001",
      "groupName": "Goa Trip",
      "balance": 2850
    }
  ]
}
```

---

## 10. Subscriptions

### `GET /subscriptions`
List all subscriptions for the user.

**Query params:** `cycle` (`weekly|monthly|yearly`), `category`

**Response `200`**
```json
{
  "data": [
    {
      "id": "sub_001",
      "name": "Netflix",
      "icon": "🎬",
      "amount": 649,
      "cycle": "monthly",
      "category": "Entertainment",
      "nextRenewal": "2026-03-28T00:00:00Z",
      "color": "#E50914",
      "active": true,
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ],
  "summary": {
    "monthlyTotal": 2932,
    "yearlyTotal": 35184,
    "count": 7
  }
}
```

---

### `POST /subscriptions`
Create a new subscription tracker.

**Request body**
```json
{
  "name": "Netflix",
  "icon": "🎬",
  "amount": 649,
  "cycle": "monthly",
  "category": "Entertainment",
  "nextRenewal": "2026-03-28T00:00:00Z",
  "color": "#E50914"            // optional
}
```

**Response `201`** — created subscription object.

---

### `GET /subscriptions/:id`
Get a single subscription.

**Response `200`** — subscription object.

---

### `PUT /subscriptions/:id`
Update a subscription (e.g. after a price change or renewal date change).

**Request body** — all fields optional.

**Response `200`** — updated subscription object.

---

### `DELETE /subscriptions/:id`
Delete (untrack) a subscription.

**Response `204`** No content.

---

### `GET /subscriptions/upcoming`
Get subscriptions renewing within the next N days.

**Query params**
| Param | Type | Description |
|---|---|---|
| `days` | number | Look-ahead window (default 7, max 30) |

**Response `200`**
```json
{
  "data": [
    {
      "id": "sub_001",
      "name": "Netflix",
      "amount": 649,
      "nextRenewal": "2026-03-28T00:00:00Z",
      "daysUntilRenewal": 8
    }
  ]
}
```

---

## 11. Reports & Analytics

### `GET /reports/summary`
High-level all-time stats for the user's dashboard.

**Response `200`**
```json
{
  "currentMonth": {
    "totalExpenses": 30820,
    "totalIncome": 110000,
    "netBalance": 79180,
    "budgetUsed": 30820,
    "budgetLimit": 40000,
    "budgetUsedPercent": 77
  },
  "allTime": {
    "totalExpenses": 185000,
    "totalIncome": 640000,
    "transactionCount": 142
  }
}
```

---

### `GET /reports/monthly`
Full monthly spending report with category breakdown.

**Query params**
| Param | Type | Description |
|---|---|---|
| `month` | `YYYY-MM` | Target month (default current month) |

**Response `200`**
```json
{
  "month": "2026-03",
  "totalExpenses": 30820,
  "totalIncome": 110000,
  "categoryBreakdown": [
    {
      "categoryId": "cat_food",
      "category": { "name": "Food & Dining", "icon": "🍔", "color": "#FF8A00" },
      "amount": 3475,
      "percentage": 11.3,
      "transactionCount": 4
    }
  ],
  "dailyTotals": [
    { "date": "2026-03-01", "expense": 22000, "income": 0 },
    { "date": "2026-03-19", "expense": 705,   "income": 0 }
  ],
  "comparedToPrevMonth": {
    "expenseDelta": 4320,
    "expenseDeltaPercent": 16.3
  },
  "topExpenses": [
    { "id": "e_014", "title": "House rent", "amount": 22000, "categoryId": "cat_rent" }
  ]
}
```

---

### `GET /reports/weekly`
Weekly spending report.

**Query params**
| Param | Type | Description |
|---|---|---|
| `date` | `YYYY-MM-DD` | Any date within the desired week (default today) |

**Response `200`**
```json
{
  "weekStart": "2026-03-16",
  "weekEnd":   "2026-03-22",
  "totalExpenses": 3174,
  "totalIncome": 0,
  "categoryBreakdown": [ ... ],
  "dailyTotals": [
    { "date": "2026-03-16", "expense": 2340, "income": 0 },
    { "date": "2026-03-17", "expense": 1948, "income": 0 },
    { "date": "2026-03-19", "expense": 705,  "income": 0 }
  ]
}
```

---

### `GET /reports/trends`
Monthly spending totals for the past N months (for charts).

**Query params**
| Param | Type | Description |
|---|---|---|
| `months` | number | How many months back (default 6, max 24) |

**Response `200`**
```json
{
  "data": [
    { "month": "2025-10", "label": "Oct", "totalExpenses": 28400, "totalIncome": 95000 },
    { "month": "2025-11", "label": "Nov", "totalExpenses": 31200, "totalIncome": 95000 },
    { "month": "2026-03", "label": "Mar", "totalExpenses": 30820, "totalIncome": 110000 }
  ]
}
```

---

### `GET /reports/categories`
Spending by category for a custom date range.

**Query params:** `startDate`, `endDate` (ISO dates)

**Response `200`**
```json
{
  "data": [
    {
      "categoryId": "cat_food",
      "category": { "name": "Food & Dining", "icon": "🍔" },
      "amount": 3475,
      "percentage": 11.3
    }
  ]
}
```

---

## 12. Notifications

### `GET /notifications`
List the user's notifications (unread first).

**Query params:** `page`, `limit`, `unreadOnly` (boolean)

**Response `200`**
```json
{
  "data": [
    {
      "id": "n_001",
      "type": "group_expense_added",
      "title": "New expense in Goa Trip",
      "body": "Aryan added Beach shack dinner — your share is ₹1,200",
      "read": false,
      "groupId": "g_001",
      "expenseId": "ge_002",
      "createdAt": "2026-03-11T09:00:00Z"
    }
  ],
  "unreadCount": 3
}
```

**Notification types:**
| Type | Trigger |
|---|---|
| `group_expense_added` | Someone adds a group expense you're split into |
| `group_expense_updated` | A group expense you're part of is edited |
| `settlement_received` | Someone records a payment to you |
| `friend_invite` | Someone invites you as a friend |
| `group_invite` | Someone adds you to a group |
| `subscription_renewal` | Subscription renewing in 3 days |
| `budget_alert` | Monthly spend crosses 80% / 100% of budget |

---

### `POST /notifications/read`
Mark specific notifications (or all) as read.

**Request body**
```json
{
  "ids": ["n_001", "n_002"],   // omit to mark all as read
  "all": false
}
```

**Response `200`**
```json
{ "updatedCount": 2 }
```

---

### `POST /notifications/device-token`
Register a push notification device token (Expo push token).

**Request body**
```json
{ "token": "ExponentPushToken[xxxxxx]", "platform": "ios" }
```

**Response `200`**
```json
{ "registered": true }
```

---

## 13. Common Shapes

### Error response
All error responses follow this shape:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "details": { "field": "amount", "issue": "Must be greater than 0" }
  }
}
```

**HTTP status codes used:**
| Code | Meaning |
|---|---|
| `200` | OK |
| `201` | Created |
| `204` | No Content (successful delete) |
| `400` | Bad Request / Validation Error |
| `401` | Unauthorized (missing or invalid token) |
| `403` | Forbidden (valid token but insufficient permissions) |
| `404` | Resource not found |
| `409` | Conflict (e.g. duplicate email on register) |
| `422` | Unprocessable Entity (e.g. split amounts don't add up) |
| `500` | Internal Server Error |

---

### Pagination object
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

Access tokens expire in **15 minutes**. Use `POST /auth/refresh` with the refresh token (valid for **30 days**) to get a new pair.
