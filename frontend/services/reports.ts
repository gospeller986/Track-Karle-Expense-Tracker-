import { apiFetch } from './api';
import type {
  ReportSummary,
  SpendingTrendResponse,
  CategoryBreakdownResponse,
  WeeklyTrendResponse,
  HeatmapResponse,
} from '@/interfaces/reports';

export function getSummary(year?: number, month?: number): Promise<ReportSummary> {
  const params = new URLSearchParams();
  if (year)  params.set('year',  String(year));
  if (month) params.set('month', String(month));
  const qs = params.toString() ? `?${params}` : '';
  return apiFetch<ReportSummary>(`/reports/summary${qs}`, { auth: true });
}

export function getSpendingTrend(months = 6): Promise<SpendingTrendResponse> {
  return apiFetch<SpendingTrendResponse>(`/reports/spending-trend?months=${months}`, { auth: true });
}

export function getWeeklyTrend(weeks = 4): Promise<WeeklyTrendResponse> {
  return apiFetch<WeeklyTrendResponse>(`/reports/weekly-trend?weeks=${weeks}`, { auth: true });
}

export function getCategoryBreakdown(year?: number, month?: number): Promise<CategoryBreakdownResponse> {
  const params = new URLSearchParams();
  if (year)  params.set('year',  String(year));
  if (month) params.set('month', String(month));
  const qs = params.toString() ? `?${params}` : '';
  return apiFetch<CategoryBreakdownResponse>(`/reports/category-breakdown${qs}`, { auth: true });
}

export function getHeatmap(days = 84): Promise<HeatmapResponse> {
  return apiFetch<HeatmapResponse>(`/reports/heatmap?days=${days}`, { auth: true });
}
