import type { ExpenseType } from '@/types/expense';

export interface CategoryEmbed {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  type: ExpenseType;
  categoryId: string;
  category: CategoryEmbed;
  date: string;        // ISO date e.g. "2026-03-22"
  note?: string | null;
  createdAt: string;
}

export interface ExpensePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ExpenseListResponse {
  data: Expense[];
  pagination: ExpensePagination;
}

export interface CreateExpensePayload {
  title: string;
  amount: number;
  type: ExpenseType;
  categoryId: string;
  date: string;        // ISO date e.g. "2026-03-22"
  note?: string;
}

export interface UpdateExpensePayload {
  title?: string;
  amount?: number;
  type?: ExpenseType;
  categoryId?: string;
  date?: string;
  note?: string;
}

export interface ExpenseQuery {
  page?: number;
  limit?: number;
  type?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}
