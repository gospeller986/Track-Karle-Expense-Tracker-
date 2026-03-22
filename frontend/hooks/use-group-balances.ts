import { useCallback, useState } from 'react';
import { getGroupBalances } from '@/services/group-expense';
import type { GroupBalance } from '@/interfaces/group-expense';

type UseGroupBalancesResult = {
  balance: GroupBalance | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useGroupBalances(groupId: string): UseGroupBalancesResult {
  const [balance, setBalance] = useState<GroupBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!groupId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getGroupBalances(groupId);
      setBalance(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load balances');
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  return { balance, isLoading, error, refetch };
}
