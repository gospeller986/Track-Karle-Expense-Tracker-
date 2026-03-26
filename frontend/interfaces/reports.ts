export interface LargestExpense {
  title: string;
  amount: number;
}

export interface ReportSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  transactionCount: number;
  avgDailySpend: number;
  largestExpense: LargestExpense | null;
  year: number;
  month: number;
}

export interface MonthlyTrend {
  month: string;        // "Jan", "Feb", …
  year: number;
  totalIncome: number;
  totalExpenses: number;
}

export interface SpendingTrendResponse {
  data: MonthlyTrend[];
}

export interface CategoryBreakdown {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface CategoryBreakdownResponse {
  data: CategoryBreakdown[];
  year: number;
  month: number;
}

export interface WeeklyTrend {
  weekStart: string;    // ISO date e.g. "2026-03-17"
  label: string;        // e.g. "Mar 17"
  totalIncome: number;
  totalExpenses: number;
}

export interface WeeklyTrendResponse {
  data: WeeklyTrend[];
}

export interface HeatmapResponse {
  activeDays: string[];       // ISO date strings e.g. ["2026-03-01", ...]
  currentStreak: number;
  longestStreak: number;
}
