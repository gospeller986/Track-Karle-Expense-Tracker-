import { useCallback, useEffect, useState } from 'react';

import { getSummary, getSpendingTrend, getCategoryBreakdown, getWeeklyTrend } from '@/services/reports';
import type { ReportSummary, MonthlyTrend, CategoryBreakdown, WeeklyTrend } from '@/interfaces/reports';

type UseReportsResult = {
  summary: ReportSummary | null;
  spendingTrend: MonthlyTrend[];
  weeklyTrend: WeeklyTrend[];
  categoryBreakdown: CategoryBreakdown[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useReports(year?: number, month?: number): UseReportsResult {
  const [summary, setSummary]                     = useState<ReportSummary | null>(null);
  const [spendingTrend, setSpendingTrend]         = useState<MonthlyTrend[]>([]);
  const [weeklyTrend, setWeeklyTrend]             = useState<WeeklyTrend[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [isLoading, setIsLoading]                 = useState(true);
  const [error, setError]                         = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [summaryRes, trendRes, weeklyRes, breakdownRes] = await Promise.all([
        getSummary(year, month),
        getSpendingTrend(6),
        getWeeklyTrend(4),
        getCategoryBreakdown(year, month),
      ]);
      setSummary(summaryRes);
      setSpendingTrend(trendRes.data);
      setWeeklyTrend(weeklyRes.data);
      setCategoryBreakdown(breakdownRes.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  useEffect(() => { fetch(); }, [fetch]);

  return { summary, spendingTrend, weeklyTrend, categoryBreakdown, isLoading, error, refetch: fetch };
}
