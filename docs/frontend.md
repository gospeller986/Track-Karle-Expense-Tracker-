# Frontend Guidelines — Expense Tracker

## Stack

- React Native 0.81 + Expo 54
- Expo Router 6 (file-based routing)
- TypeScript 5.9
- expo-secure-store (token storage)
- @shopify/flash-list (optimized lists)

## Directory Structure

```
frontend/
├── app/                    # Expo Router screens (file = route)
│   ├── (tabs)/             # Bottom tab navigator
│   ├── auth/               # Unauthenticated screens
│   ├── expense/            # Expense detail/add screens
│   ├── group/              # Group screens
│   └── profile/            # Profile screens
├── components/
│   └── ui/                 # Base reusable components (Button, Card, Input…)
├── constants/              # Theme tokens, static data
├── context/                # React contexts (AuthContext)
├── hooks/                  # Custom React hooks
├── interfaces/             # TypeScript interfaces (object shapes, contracts)
├── services/               # API client functions (one file per domain)
├── types/                  # TypeScript types (unions, primitives, mapped types)
└── assets/                 # Images, icons, fonts
```

## Code Size Rule

**No component or screen file may exceed 400 lines.**

When a file approaches 400 lines:
1. Extract sub-components into `components/` (or a local `components/` subfolder next to the screen).
2. Move complex state logic into a custom hook in `hooks/`.
3. Move static data/config into `constants/`.

## Type Organization

| What | Where |
|------|-------|
| Object shapes, API response contracts, component prop interfaces | `frontend/interfaces/` |
| Union types, string literals, enums, mapped types, utility types | `frontend/types/` |

**Example**:
```typescript
// interfaces/expense.ts
export interface Expense {
  id: string;
  title: string;
  amount: number;
  type: ExpenseType;  // ← references a type
  categoryId: string;
  date: string;
}

// types/expense.ts
export type ExpenseType = 'expense' | 'income';
export type ExpenseSortField = 'date' | 'amount' | 'title';
```

Do **not** define interfaces or types inline in screen/component files unless they are purely local (e.g., component internal state shape).

## Hooks Pattern

All data fetching lives in hooks, not in screens:

```typescript
// hooks/use-expenses.ts
export function useExpenses(filters?: ExpenseFilters): UseExpensesResult {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // ...
  return { expenses, isLoading, error, refetch };
}
```

Screens consume hooks and only render:
```typescript
export default function ExpensesScreen() {
  const { expenses, isLoading, error } = useExpenses();
  // render only — no fetch logic here
}
```

## Services Pattern

One file per API domain. Each function maps to one endpoint:

```typescript
// services/expense.ts
export function listExpenses(params?: ExpenseQuery): Promise<Expense[]> { ... }
export function createExpense(payload: CreateExpensePayload): Promise<Expense> { ... }
export function updateExpense(id: string, payload: UpdateExpensePayload): Promise<Expense> { ... }
export function deleteExpense(id: string): Promise<void> { ... }
```

Always use `apiFetch` from `services/api.ts` — it handles auth headers and token refresh.

## Navigation

- Expo Router file-based routing: file path = URL path
- Protected routes: `_layout.tsx` at root checks `useAuth().user` and redirects
- `router.push()` for navigation, `router.back()` for dismissal
- Modal screens: use Stack with `presentation: 'modal'`

## Styling

- Use `useTheme()` for all colors, spacing, border radii — no hardcoded hex values in components
- `colors.bg`, `colors.surface`, `colors.textPrimary`, `colors.textSecondary`, `colors.accent`
- `colors.expense` / `colors.income` for financial indicators
- `ThemedText` component for all text (supports `variant` prop: h1–h4, bodyLg, body, caption, label)
- `StyleSheet.create()` at bottom of file for static styles; dynamic styles inline

## camelCase Contract

All API responses use camelCase. Frontend types must match exactly:
- `isDefault` (not `is_default` or `isSystem`)
- `accessToken`, `refreshToken`
- `monthlyBudget`, `notificationsEnabled`

## Error Handling

- Wrap API calls in try/catch in hooks, expose `error: string | null`
- Show errors with `ThemedText color={colors.expense}` or an Alert
- Never swallow errors silently

## Component Checklist

Before creating a new component:
- [ ] Does it already exist in `components/ui/`?
- [ ] Will it stay under 400 lines?
- [ ] Are its types in `interfaces/` or `types/`?
- [ ] Does it use `useTheme()` for colors?
- [ ] Does it accept `style` prop for external overrides?
