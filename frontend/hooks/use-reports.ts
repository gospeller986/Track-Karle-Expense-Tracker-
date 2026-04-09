import { useCallback, useEffect, useMemo, useState } from 'react';

import { getSummary, getSpendingTrend, getCategoryBreakdown, getWeeklyTrend } from '@/services/reports';
import type { ReportSummary, MonthlyTrend, CategoryBreakdown, WeeklyTrend } from '@/interfaces/reports';

const MONTH_SHORT_TO_NUM: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5,  Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};

type UseReportsResult = {
  summary: ReportSummary | null;
  spendingTrend: MonthlyTrend[];
  weeklyTrend: WeeklyTrend[];
  categoryBreakdown: CategoryBreakdown[];
  /** Sum of (income − expenses) for all months strictly before the selected year/month */
  cumulativeSavings: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useReports(year?: number, month?: number): UseReportsResult {
  const [summary, setSummary]                     = useState<ReportSummary | null>(null);
  const [fullTrend, setFullTrend]                 = useState<MonthlyTrend[]>([]);
  const [weeklyTrend, setWeeklyTrend]             = useState<WeeklyTrend[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [isLoading, setIsLoading]                 = useState(true);
  const [error, setError]                         = useState<string | null>(null);

  // Clear month-specific data the moment year/month changes so stale values
  // never leak into the next render while the new fetch is in flight.
  useEffect(() => {
    setSummary(null);
    setCategoryBreakdown([]);
    setIsLoading(true);
  }, [year, month]);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    console.log('[useReports] fetching for', year, month);
    try {
      const [summaryRes, trendRes, weeklyRes, breakdownRes] = await Promise.allSettled([
        getSummary(year, month),
        getSpendingTrend(24),
        getWeeklyTrend(4),
        getCategoryBreakdown(year, month),
      ]);

      console.log('[useReports] summary:', summaryRes);
      console.log('[useReports] spendingTrend:', trendRes);
      console.log('[useReports] weeklyTrend:', weeklyRes);
      console.log('[useReports] breakdown:', breakdownRes);

      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value);
      else console.error('[useReports] summary FAILED:', summaryRes.reason);

      if (trendRes.status === 'fulfilled') {
        setFullTrend(trendRes.value.data);
      } else console.error('[useReports] spendingTrend FAILED:', trendRes.reason);

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

  // 6-month window ending at (and including) the selected month — drives all trend charts
  const spendingTrend = useMemo(() => {
    const now = new Date();
    const targetYear  = year  ?? now.getFullYear();
    const targetMonth = month ?? now.getMonth() + 1;
    const idx = fullTrend.findIndex(t => {
      return t.year === targetYear && (MONTH_SHORT_TO_NUM[t.month] ?? 0) === targetMonth;
    });
    if (idx === -1) return fullTrend.slice(-6);
    return fullTrend.slice(Math.max(0, idx - 5), idx + 1);
  }, [fullTrend, year, month]);

  const cumulativeSavings = useMemo(() => {
    const now = new Date();
    const targetYear  = year  ?? now.getFullYear();
    const targetMonth = month ?? now.getMonth() + 1;
    return fullTrend
      .filter(t => {
        const tMonth = MONTH_SHORT_TO_NUM[t.month] ?? 0;
        return t.year < targetYear || (t.year === targetYear && tMonth < targetMonth);
      })
      .reduce((sum, t) => sum + (t.totalIncome - t.totalExpenses), 0);
  }, [fullTrend, year, month]);

  return { summary, spendingTrend, weeklyTrend, categoryBreakdown, cumulativeSavings, isLoading, error, refetch: fetch };
}
