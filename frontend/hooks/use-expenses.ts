import { useCallback, useEffect, useState } from 'react';

import { listExpenses } from '@/services/expense';
import type { Expense, ExpensePagination, ExpenseQuery } from '@/interfaces/expense';

type UseExpensesResult = {
  expenses: Expense[];
  pagination: ExpensePagination | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useExpenses(query?: ExpenseQuery): UseExpensesResult {
  const [expenses, setExpenses]   = useState<Expense[]>([]);
  const [pagination, setPagination] = useState<ExpensePagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  // Stable key so the effect only re-runs when the query actually changes
  const queryKey = JSON.stringify(query);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await listExpenses(query);
      setExpenses(res.data);
      setPagination(res.pagination);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  useEffect(() => { fetch(); }, [fetch]);

  return { expenses, pagination, isLoading, error, refetch: fetch };
}
