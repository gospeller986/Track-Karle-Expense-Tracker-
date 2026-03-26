import { useCallback, useEffect, useRef, useState } from 'react';

import { getHeatmap } from '@/services/reports';
import { expenseRefreshBus } from '@/utils/refresh-bus';
import type { HeatmapResponse } from '@/interfaces/reports';

interface StreakState extends HeatmapResponse {
  isLoading: boolean;
  streakJustIncremented: boolean;
}

const DEFAULT: StreakState = {
  activeDays: [],
  currentStreak: 0,
  longestStreak: 0,
  isLoading: true,
  streakJustIncremented: false,
};

export function useStreak() {
  const [state, setState] = useState<StreakState>(DEFAULT);
  const prevStreak = useRef<number>(0);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetch = useCallback(async () => {
    try {
      const data = await getHeatmap(84);
      const increased = data.currentStreak > prevStreak.current && prevStreak.current > 0;
      prevStreak.current = data.currentStreak;

      setState(s => ({ ...s, ...data, isLoading: false, streakJustIncremented: increased }));

      if (increased) {
        if (resetTimer.current) clearTimeout(resetTimer.current);
        resetTimer.current = setTimeout(() => {
          setState(s => ({ ...s, streakJustIncremented: false }));
        }, 2000);
      }
    } catch {
      setState(s => ({ ...s, isLoading: false }));
    }
  }, []);

  // Initial load
  useEffect(() => { fetch(); }, [fetch]);

  // Re-fetch when an expense is logged
  useEffect(() => {
    return expenseRefreshBus.subscribe(fetch);
  }, [fetch]);

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  return { ...state, refetch: fetch };
}
