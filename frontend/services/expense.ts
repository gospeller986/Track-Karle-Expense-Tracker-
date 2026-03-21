import { apiFetch } from './api';
import type {
  CreateExpensePayload,
  Expense,
  ExpenseListResponse,
  ExpenseQuery,
  UpdateExpensePayload,
} from '@/interfaces/expense';

export type { Expense, ExpenseListResponse, ExpenseQuery };

export function listExpenses(params?: ExpenseQuery): Promise<ExpenseListResponse> {
  const qs = params
    ? '?' +
      new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v != null)
          .map(([k, v]) => [k, String(v)]),
      ).toString()
    : '';
  return apiFetch<ExpenseListResponse>(`/expenses${qs}`, { auth: true });
}

export function createExpense(payload: CreateExpensePayload): Promise<Expense> {
  return apiFetch<Expense>('/expenses', {
    method: 'POST',
    auth: true,
    body: JSON.stringify(payload),
  });
}

export function getExpense(id: string): Promise<Expense> {
  return apiFetch<Expense>(`/expenses/${id}`, { auth: true });
}

export function updateExpense(id: string, payload: UpdateExpensePayload): Promise<Expense> {
  return apiFetch<Expense>(`/expenses/${id}`, {
    method: 'PUT',
    auth: true,
    body: JSON.stringify(payload),
  });
}

export function deleteExpense(id: string): Promise<void> {
  return apiFetch<void>(`/expenses/${id}`, { method: 'DELETE', auth: true });
}
