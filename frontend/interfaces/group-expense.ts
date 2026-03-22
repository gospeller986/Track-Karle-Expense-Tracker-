export interface GroupExpenseSplit {
  userId: string;
  userName: string;
  amount: number;
  percentage: number | null;
  isSettled: boolean;
}

export interface GroupExpense {
  id: string;
  groupId: string;
  categoryId: string;
  paidBy: string;
  paidByName: string;
  title: string;
  amount: number;
  date: string;
  splitType: 'equal' | 'unequal' | 'percentage';
  note: string | null;
  isSettled: boolean;
  splits: GroupExpenseSplit[];
  createdAt: string;
}

export interface GroupExpenseListResponse {
  data: GroupExpense[];
}

export interface DebtItem {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
}

export interface GroupBalance {
  yourBalance: number;
  totalExpenses: number;
  debts: DebtItem[];
}

export interface Settlement {
  id: string;
  groupId: string;
  payerId: string;
  payerName: string;
  payeeId: string;
  payeeName: string;
  amount: number;
  date: string;
  note: string | null;
  createdAt: string;
}

// ── Request payloads ──────────────────────────────────────────────────────────

export interface SplitEntry {
  userId: string;
  amount?: number;
  percentage?: number;
}

export interface CreateGroupExpensePayload {
  categoryId: string;
  title: string;
  amount: number;
  date: string;
  paidBy: string;
  splitType: 'equal' | 'unequal' | 'percentage';
  splitWith: string[];
  splits?: SplitEntry[];
  note?: string;
}

export interface CreateSettlementPayload {
  payeeId: string;
  amount: number;
  date: string;
  note?: string;
}
