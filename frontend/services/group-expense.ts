import { apiFetch } from './api';
import type {
  GroupExpense,
  GroupExpenseListResponse,
  GroupBalance,
  Settlement,
  CreateGroupExpensePayload,
  CreateSettlementPayload,
} from '@/interfaces/group-expense';

export async function listGroupExpenses(groupId: string): Promise<GroupExpenseListResponse> {
  return apiFetch<GroupExpenseListResponse>(`/groups/${groupId}/expenses`, { auth: true });
}

export async function addGroupExpense(
  groupId: string,
  payload: CreateGroupExpensePayload,
): Promise<GroupExpense> {
  return apiFetch<GroupExpense>(`/groups/${groupId}/expenses`, {
    auth: true,
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteGroupExpense(groupId: string, expenseId: string): Promise<void> {
  return apiFetch<void>(`/groups/${groupId}/expenses/${expenseId}`, {
    auth: true,
    method: 'DELETE',
  });
}

export async function getGroupBalances(groupId: string): Promise<GroupBalance> {
  return apiFetch<GroupBalance>(`/groups/${groupId}/balances`, { auth: true });
}

export async function recordSettlement(
  groupId: string,
  payload: CreateSettlementPayload,
): Promise<Settlement> {
  return apiFetch<Settlement>(`/groups/${groupId}/settle`, {
    auth: true,
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
