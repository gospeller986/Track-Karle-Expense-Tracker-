// ─────────────────────────────────────────────────────────────
// Mock data — replace with real API calls later
// ─────────────────────────────────────────────────────────────

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

export type Expense = {
  id: string;
  title: string;
  amount: number;
  categoryId: string;
  date: string; // ISO string
  note?: string;
  type: 'expense' | 'income';
};

export type GroupMember = {
  id: string;
  name: string;
  avatar?: string;
  initials: string;
};

export type Group = {
  id: string;
  name: string;
  icon: string;
  members: GroupMember[];
  totalExpenses: number;
  yourBalance: number; // positive = owed to you, negative = you owe
};

export type SplitType = 'equal' | 'unequal' | 'percentage';

export type MemberSplit = {
  memberId: string;
  amount: number;      // absolute amount (used for unequal)
  percentage: number;  // 0–100 (used for percentage; equal computes this automatically)
};

export type GroupExpense = {
  id: string;
  groupId: string;
  title: string;
  amount: number;
  categoryId: string;
  paidBy: string;          // member id
  splitType: SplitType;
  splitWith: string[];     // member ids included in split
  splits?: MemberSplit[];  // populated for unequal / percentage; derived for equal
  date: string;
  settled: boolean;
  note?: string;
};

export type Subscription = {
  id: string;
  name: string;
  icon: string;
  amount: number;
  cycle: 'weekly' | 'monthly' | 'yearly';
  nextRenewal: string; // ISO string
  color: string;
  category: string;
};

// ─── Categories ───────────────────────────────────────────────
export const CATEGORIES: Category[] = [
  { id: 'food',          name: 'Food & Dining',   icon: '🍔', color: '#FF8A00' },
  { id: 'transport',     name: 'Transport',        icon: '🚗', color: '#4D9EFF' },
  { id: 'shopping',      name: 'Shopping',         icon: '🛍️', color: '#FF4D9E' },
  { id: 'entertainment', name: 'Entertainment',    icon: '🎬', color: '#7B61FF' },
  { id: 'health',        name: 'Health',           icon: '💊', color: '#00C48C' },
  { id: 'utilities',     name: 'Utilities',        icon: '⚡', color: '#FFD700' },
  { id: 'rent',          name: 'Rent',             icon: '🏠', color: '#FF6B6B' },
  { id: 'subscriptions', name: 'Subscriptions',    icon: '📱', color: '#C9F31D' },
  { id: 'travel',        name: 'Travel',           icon: '✈️', color: '#00B4D8' },
  { id: 'other',         name: 'Other',            icon: '💰', color: '#888888' },
];

// ─── Expenses ─────────────────────────────────────────────────
export const EXPENSES: Expense[] = [
  { id: 'e1',  title: 'Zomato order',       amount: 485,   categoryId: 'food',          date: '2026-03-19T13:30:00Z', type: 'expense' },
  { id: 'e2',  title: 'Uber to office',     amount: 220,   categoryId: 'transport',     date: '2026-03-19T09:10:00Z', type: 'expense' },
  { id: 'e3',  title: 'Salary credit',      amount: 95000, categoryId: 'other',         date: '2026-03-18T00:00:00Z', type: 'income'  },
  { id: 'e4',  title: 'Amazon order',       amount: 1299,  categoryId: 'shopping',      date: '2026-03-17T18:20:00Z', type: 'expense' },
  { id: 'e5',  title: 'Netflix',            amount: 649,   categoryId: 'subscriptions', date: '2026-03-17T00:00:00Z', type: 'expense' },
  { id: 'e6',  title: 'Grocery – BigBasket', amount: 2340, categoryId: 'food',          date: '2026-03-16T11:00:00Z', type: 'expense' },
  { id: 'e7',  title: 'Electricity bill',   amount: 1820,  categoryId: 'utilities',     date: '2026-03-15T10:00:00Z', type: 'expense' },
  { id: 'e8',  title: 'PVR Cinemas',        amount: 750,   categoryId: 'entertainment', date: '2026-03-14T19:30:00Z', type: 'expense' },
  { id: 'e9',  title: 'Pharmacy',           amount: 390,   categoryId: 'health',        date: '2026-03-13T14:00:00Z', type: 'expense' },
  { id: 'e10', title: 'Swiggy Instamart',   amount: 650,   categoryId: 'food',          date: '2026-03-12T20:00:00Z', type: 'expense' },
  { id: 'e11', title: 'Spotify',            amount: 119,   categoryId: 'subscriptions', date: '2026-03-11T00:00:00Z', type: 'expense' },
  { id: 'e12', title: 'Rapido',             amount: 89,    categoryId: 'transport',     date: '2026-03-11T08:30:00Z', type: 'expense' },
  { id: 'e13', title: 'Freelance payment',  amount: 15000, categoryId: 'other',         date: '2026-03-10T00:00:00Z', type: 'income'  },
  { id: 'e14', title: 'House rent',         amount: 22000, categoryId: 'rent',          date: '2026-03-01T00:00:00Z', type: 'expense' },
];

// ─── Groups ───────────────────────────────────────────────────
export const GROUP_MEMBERS: GroupMember[] = [
  { id: 'u1', name: 'You',       initials: 'YO' },
  { id: 'u2', name: 'Aryan',     initials: 'AR' },
  { id: 'u3', name: 'Priya',     initials: 'PR' },
  { id: 'u4', name: 'Karan',     initials: 'KA' },
  { id: 'u5', name: 'Sneha',     initials: 'SN' },
  { id: 'u6', name: 'Rohan',     initials: 'RO' },
];

export const GROUPS: Group[] = [
  {
    id: 'g1',
    name: 'Goa Trip 🌊',
    icon: '🌊',
    members: [GROUP_MEMBERS[0], GROUP_MEMBERS[1], GROUP_MEMBERS[2], GROUP_MEMBERS[3]],
    totalExpenses: 24600,
    yourBalance: 3200,
  },
  {
    id: 'g2',
    name: 'Flat – Koramangala',
    icon: '🏠',
    members: [GROUP_MEMBERS[0], GROUP_MEMBERS[4], GROUP_MEMBERS[5]],
    totalExpenses: 68000,
    yourBalance: -1500,
  },
  {
    id: 'g3',
    name: 'Office Lunch',
    icon: '🍱',
    members: [GROUP_MEMBERS[0], GROUP_MEMBERS[1], GROUP_MEMBERS[4]],
    totalExpenses: 4800,
    yourBalance: 480,
  },
];

export const GROUP_EXPENSES: GroupExpense[] = [
  {
    id: 'ge1', groupId: 'g1', title: 'Hotel Taj', amount: 12000, categoryId: 'travel',
    paidBy: 'u1', splitType: 'equal', splitWith: ['u1','u2','u3','u4'],
    date: '2026-03-10T00:00:00Z', settled: false, note: '2 nights stay',
  },
  {
    id: 'ge2', groupId: 'g1', title: 'Beach shack dinner', amount: 3400, categoryId: 'food',
    paidBy: 'u2', splitType: 'unequal', splitWith: ['u1','u2','u3','u4'],
    splits: [
      { memberId: 'u1', amount: 1200, percentage: 35 },
      { memberId: 'u2', amount: 800,  percentage: 24 },
      { memberId: 'u3', amount: 900,  percentage: 26 },
      { memberId: 'u4', amount: 500,  percentage: 15 },
    ],
    date: '2026-03-11T00:00:00Z', settled: false,
  },
  {
    id: 'ge3', groupId: 'g1', title: 'Scuba diving', amount: 5600, categoryId: 'entertainment',
    paidBy: 'u3', splitType: 'percentage', splitWith: ['u1','u2','u3','u4'],
    splits: [
      { memberId: 'u1', amount: 1400, percentage: 25 },
      { memberId: 'u2', amount: 1400, percentage: 25 },
      { memberId: 'u3', amount: 1400, percentage: 25 },
      { memberId: 'u4', amount: 1400, percentage: 25 },
    ],
    date: '2026-03-12T00:00:00Z', settled: false,
  },
  {
    id: 'ge4', groupId: 'g2', title: 'March rent', amount: 45000, categoryId: 'rent',
    paidBy: 'u5', splitType: 'equal', splitWith: ['u1','u5','u6'],
    date: '2026-03-01T00:00:00Z', settled: true,
  },
  {
    id: 'ge5', groupId: 'g2', title: 'Internet bill', amount: 1200, categoryId: 'utilities',
    paidBy: 'u6', splitType: 'equal', splitWith: ['u1','u5','u6'],
    date: '2026-03-05T00:00:00Z', settled: false,
  },
  {
    id: 'ge6', groupId: 'g3', title: 'Chai & biryani', amount: 890, categoryId: 'food',
    paidBy: 'u1', splitType: 'equal', splitWith: ['u1','u2','u5'],
    date: '2026-03-18T00:00:00Z', settled: false,
  },
];

// ─── Subscriptions ────────────────────────────────────────────
export const SUBSCRIPTIONS: Subscription[] = [
  { id: 's1', name: 'Netflix',       icon: '🎬', amount: 649,  cycle: 'monthly', nextRenewal: '2026-03-28T00:00:00Z', color: '#E50914', category: 'Entertainment' },
  { id: 's2', name: 'Spotify',       icon: '🎵', amount: 119,  cycle: 'monthly', nextRenewal: '2026-03-25T00:00:00Z', color: '#1DB954', category: 'Music'         },
  { id: 's3', name: 'YouTube Premium',icon: '▶️', amount: 189, cycle: 'monthly', nextRenewal: '2026-04-02T00:00:00Z', color: '#FF0000', category: 'Entertainment' },
  { id: 's4', name: 'iCloud',        icon: '☁️', amount: 75,   cycle: 'monthly', nextRenewal: '2026-04-01T00:00:00Z', color: '#3478F6', category: 'Storage'       },
  { id: 's5', name: 'ChatGPT Plus',  icon: '🤖', amount: 1700, cycle: 'monthly', nextRenewal: '2026-03-22T00:00:00Z', color: '#10A37F', category: 'Productivity'  },
  { id: 's6', name: 'Notion',        icon: '📝', amount: 0,    cycle: 'monthly', nextRenewal: '2026-04-10T00:00:00Z', color: '#FFFFFF', category: 'Productivity'  },
  { id: 's7', name: 'Figma',         icon: '🎨', amount: 1200, cycle: 'monthly', nextRenewal: '2026-04-05T00:00:00Z', color: '#F24E1E', category: 'Design'        },
];

// ─── Reports / Aggregates ─────────────────────────────────────
export const MONTHLY_SPENDING = [
  { month: 'Oct', amount: 28400 },
  { month: 'Nov', amount: 31200 },
  { month: 'Dec', amount: 42100 },
  { month: 'Jan', amount: 29800 },
  { month: 'Feb', amount: 26500 },
  { month: 'Mar', amount: 30820 },
];

export const CATEGORY_SPENDING = [
  { categoryId: 'food',          amount: 3475, percentage: 28 },
  { categoryId: 'rent',          amount: 22000, percentage: 45 },
  { categoryId: 'subscriptions', amount: 2732, percentage: 9  },
  { categoryId: 'transport',     amount: 309,  percentage: 4  },
  { categoryId: 'shopping',      amount: 1299, percentage: 5  },
  { categoryId: 'entertainment', amount: 750,  percentage: 4  },
  { categoryId: 'other',         amount: 255,  percentage: 5  },
];

// ─── User Profile ─────────────────────────────────────────────
export const USER_PROFILE = {
  id: 'u1',
  name: 'Satyajit',
  email: 'satyajit@example.com',
  initials: 'SP',
  currency: '₹',
  monthlyBudget: 40000,
};

// ─── Helpers ──────────────────────────────────────────────────
export function getCategoryById(id: string): Category {
  return CATEGORIES.find(c => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}

export function formatCurrency(amount: number, currency = '₹'): string {
  if (amount >= 100000) return `${currency}${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000)   return `${currency}${(amount / 1000).toFixed(1)}K`;
  return `${currency}${amount.toLocaleString('en-IN')}`;
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString())     return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function daysUntil(isoString: string): number {
  const diff = new Date(isoString).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
