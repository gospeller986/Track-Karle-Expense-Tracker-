import { useCallback, useState } from 'react';
import { listGroupExpenses } from '@/services/group-expense';
import type { GroupExpense } from '@/interfaces/group-expense';

type UseGroupExpensesResult = {
  expenses: GroupExpense[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useGroupExpenses(groupId: string): UseGroupExpensesResult {
  const [expenses, setExpenses] = useState<GroupExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!groupId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await listGroupExpenses(groupId);
      setExpenses(data.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  return { expenses, isLoading, error, refetch };
}
