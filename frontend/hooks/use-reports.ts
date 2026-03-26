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
    console.log('[useReports] fetching for', year, month);
    try {
      const [summaryRes, trendRes, weeklyRes, breakdownRes] = await Promise.allSettled([
        getSummary(year, month),
        getSpendingTrend(6),
        getWeeklyTrend(4),
        getCategoryBreakdown(year, month),
      ]);

      console.log('[useReports] summary:', summaryRes);
      console.log('[useReports] spendingTrend:', trendRes);
      console.log('[useReports] weeklyTrend:', weeklyRes);
      console.log('[useReports] breakdown:', breakdownRes);

      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value);
      else console.error('[useReports] summary FAILED:', summaryRes.reason);

      if (trendRes.status === 'fulfilled') setSpendingTrend(trendRes.value.data);
      else console.error('[useReports] spendingTrend FAILED:', trendRes.reason);

      if (weeklyRes.status === 'fulfilled') setWeeklyTrend(weeklyRes.value.data);
      else console.error('[useReports] weeklyTrend FAILED:', weeklyRes.reason);

      if (breakdownRes.status === 'fulfilled') setCategoryBreakdown(breakdownRes.value.data);
      else console.error('[useReports] breakdown FAILED:', breakdownRes.reason);

    } catch (e) {
      console.error('[useReports] unexpected error:', e);
      setError(e instanceof Error ? e.message : 'Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  useEffect(() => { fetch(); }, [fetch]);

  return { summary, spendingTrend, weeklyTrend, categoryBreakdown, isLoading, error, refetch: fetch };
}
