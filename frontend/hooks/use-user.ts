import { useCallback, useEffect, useState } from 'react';

import { getMe, getInitials, type UserProfile } from '@/services/user';

type UseUserResult = {
  user: UserProfile | null;
  initials: string;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useUser(): UseUserResult {
  const [user, setUser]         = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const profile = await getMe();
      setUser(profile);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const initials = user ? getInitials(user.name) : '?';

  return { user, initials, isLoading, error, refetch: fetch };
}
