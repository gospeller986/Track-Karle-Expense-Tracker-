import { useCallback, useEffect, useState } from 'react';

import { listSubscriptions } from '@/services/subscription';
import type { Subscription, SubscriptionSummary } from '@/interfaces/subscription';

type UseSubscriptionsResult = {
  subscriptions: Subscription[];
  summary: SubscriptionSummary | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useSubscriptions(): UseSubscriptionsResult {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [summary, setSummary]             = useState<SubscriptionSummary | null>(null);
  const [isLoading, setIsLoading]         = useState(true);
  const [error, setError]                 = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await listSubscriptions();
      setSubscriptions(res.data);
      setSummary(res.summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load subscriptions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { subscriptions, summary, isLoading, error, refetch: fetch };
}
