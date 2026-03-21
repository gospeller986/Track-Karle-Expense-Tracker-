import { useCallback, useEffect, useState } from 'react';
import { listGroups } from '@/services/group';
import type { Group } from '@/interfaces/group';

type UseGroupsResult = {
  groups: Group[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useGroups(): UseGroupsResult {
  const [groups, setGroups]     = useState<Group[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listGroups();
      setGroups(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { groups, isLoading, error, refetch: fetch };
}
