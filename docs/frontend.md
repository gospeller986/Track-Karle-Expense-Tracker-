# Frontend Guidelines — Expense Tracker

## Stack

- React Native 0.81 + Expo 54
- Expo Router 6 (file-based routing)
- TypeScript 5.9
- expo-secure-store (token storage)
- expo-camera (in-app QR scanner)
- react-native-qrcode-svg (QR code rendering)
- @shopify/flash-list (optimized lists)
- @react-native-community/datetimepicker (date picker, native spinner)
- expo-linear-gradient, @expo/vector-icons (Ionicons)

## Directory Structure

```
frontend/
├── app/                        # Expo Router screens (file = route)
│   ├── (tabs)/                 # Bottom tab navigator
│   │   ├── _layout.tsx         # Tab bar config
│   │   ├── index.tsx           # Dashboard
│   │   ├── expenses.tsx        # Expense list
│   │   ├── groups.tsx          # Groups list + QR scan entry
│   │   ├── subscriptions.tsx   # Subscriptions list
│   │   └── reports.tsx         # Reports (placeholder)
│   ├── auth/                   # Unauthenticated screens
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── expense/
│   │   ├── add.tsx             # Add expense modal
│   │   └── [id].tsx            # Expense detail/edit
│   ├── group/
│   │   ├── create.tsx          # Single-step group creation modal
│   │   ├── [id].tsx            # Group detail (balance, members, expenses)
│   │   ├── invite.tsx          # QR code + share invite screen
│   │   ├── scan.tsx            # In-app QR scanner modal
│   │   └── add-expense.tsx     # Add group expense modal (stub)
│   ├── subscription/
│   │   ├── add.tsx             # Add subscription modal
│   │   └── [id].tsx            # Subscription detail/edit
│   ├── join/
│   │   └── [token].tsx         # Deep link handler: exptracker://join/<token>
│   ├── profile/
│   │   └── index.tsx           # Profile screen
│   └── _layout.tsx             # Root stack, auth guard, screen options
├── components/
│   ├── themed-text.tsx         # ThemedText with variant prop
│   └── ui/                     # Base reusable components (Card, Badge, Input…)
├── constants/                  # Theme tokens, mock-data (formatCurrency)
├── context/
│   └── auth-context.tsx        # AuthProvider, useAuth hook
├── hooks/                      # Custom React hooks (data fetching)
│   ├── use-expenses.ts
│   ├── use-groups.ts
│   ├── use-subscriptions.ts
│   ├── use-categories.ts
│   └── use-theme.ts
├── interfaces/                 # TypeScript interfaces (object shapes, contracts)
│   ├── expense.ts
│   ├── group.ts
│   └── subscription.ts
├── services/                   # API client functions (one file per domain)
│   ├── api.ts                  # apiFetch, ApiError, API_BASE
│   ├── auth.ts
│   ├── category.ts
│   ├── expense.ts
│   ├── group.ts
│   ├── subscription.ts
│   └── user.ts
├── types/                      # TypeScript types (unions, primitives, mapped types)
└── assets/                     # Images, icons, fonts
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

Do **not** define interfaces or types inline in screen/component files unless they are purely local.

## Hooks Pattern

All data fetching lives in hooks, not in screens:

```typescript
// hooks/use-groups.ts
export function useGroups(): UseGroupsResult {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // fetch + refetch logic
  return { groups, isLoading, error, refetch };
}
```

Screens only consume hooks and render:
```typescript
export default function GroupsScreen() {
  const { groups, isLoading, refetch } = useGroups();
  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));
  // render only
}
```

**Tab screens use `useFocusEffect` to refresh on return:**
```typescript
useFocusEffect(useCallback(() => { refetch(); }, [refetch]));
```

## Services Pattern

One file per API domain. Each function maps to one endpoint. Always use `apiFetch`:

```typescript
// services/group.ts
export async function listGroups(): Promise<GroupListResponse> {
  return apiFetch<GroupListResponse>('/groups', { auth: true });
}
export async function createGroup(payload: CreateGroupPayload): Promise<Group> {
  return apiFetch<Group>('/groups', { auth: true, method: 'POST', body: JSON.stringify(payload) });
}
```

`apiFetch` handles: auth header injection, 401 → token refresh, error parsing into `ApiError`.

## Navigation & Screen Registration

All non-tab screens are registered in `app/_layout.tsx` with presentation options:

```typescript
<Stack.Screen name="group/create"   options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
<Stack.Screen name="group/scan"     options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
<Stack.Screen name="group/[id]"     options={{ animation: 'slide_from_right' }} />
<Stack.Screen name="group/invite"   options={{ animation: 'slide_from_right' }} />
<Stack.Screen name="join/[token]"   options={{ presentation: 'modal', animation: 'fade' }} />
```

## Deep Linking

App URL scheme: **`exptracker`** (set in `app.json → expo.scheme`).

```typescript
// exptracker://join/<token> → handled by app/join/[token].tsx
// In Expo Go, use the in-app scanner instead of native camera deep links
```

**In-app QR Scanner (`app/group/scan.tsx`):**
- Uses `CameraView` from `expo-camera` with `barcodeScannerSettings={{ barcodeTypes: ['qr'] }}`
- `parseToken(raw)` extracts token from any QR format: `exptracker://join/<token>`, HTTP URL, raw string
- Calls `joinGroup(token)` → navigates to group on success
- Entry point: QR icon button in Groups tab header

**Group Invite Screen (`app/group/invite.tsx`):**
- QR encodes `exptracker://join/<token>` directly (for in-app scanner)
- Share Invite: iOS passes `url: 'exptracker://join/<token>'` to `Share.share` → tappable in iMessage
- Android: link embedded in message body

## Styling

- Use `useTheme()` for all colors, spacing, border radii — no hardcoded hex values in components
- `colors.bg`, `colors.surface`, `colors.surfaceElevated`, `colors.border`
- `colors.textPrimary`, `colors.textSecondary`, `colors.textTertiary`
- `colors.accent`, `colors.secondary`, `colors.secondaryMuted`
- `colors.expense` / `colors.expenseMuted` / `colors.income` / `colors.incomeMuted`
- `ThemedText` for all text — `variant` prop: `display`, `h1`–`h4`, `bodyLg`, `body`, `bodySm`, `caption`, `label`
- `StyleSheet.create()` at bottom of file for static styles; dynamic styles inline

## camelCase Contract

All API responses use camelCase. Frontend interfaces must match exactly:
- `createdBy`, `memberCount`, `yourBalance`, `totalExpenses`, `inviteToken`, `inviteLink`
- `accessToken`, `refreshToken`, `monthlyBudget`, `notificationsEnabled`
- Category exception: `isDefault` (backend field `is_system` aliased)

## Group Interface

```typescript
// interfaces/group.ts
export interface Group {
  id: string; name: string; icon: string; description: string | null;
  createdBy: string;        // ← used to gate delete (creator only)
  memberCount: number; yourBalance: number; totalExpenses: number;
  members: GroupMember[]; createdAt: string;
}
export interface GroupMember { id: string; name: string; initials: string; avatarUrl: string | null; }
export interface GroupInvite { inviteToken: string; inviteLink: string; groupId: string; groupName: string; }
```

## Subscription: Auto-icon + Date Picker

```typescript
// Category → emoji mapping (no manual emoji input)
const CATEGORY_ICONS: Record<string, string> = {
  Entertainment: '🎬', Music: '🎵', Productivity: '💼',
  Storage: '💾', Design: '🎨', News: '📰', Health: '🏃', Other: '📦',
};
const icon = CATEGORY_ICONS[category] ?? '📦';

// Renewal is a Date object, formatted as YYYY-MM-DD for the API
// DateTimePicker: display='spinner' on iOS, display='default' on Android
```

## Error Handling

- Wrap API calls in try/catch in hooks, expose `error: string | null`
- Show errors with `ThemedText color={colors.expense}` or an `Alert`
- Never swallow errors silently
