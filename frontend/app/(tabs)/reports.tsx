import { useState, useCallback } from 'react';
import { ScrollView, View, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/hooks/use-theme';
import { useReports } from '@/hooks/use-reports';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/constants/mock-data';
import type { CategoryBreakdown } from '@/interfaces/reports';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type Period = 'weekly' | 'monthly';

// Generic bar chart point — works for both monthly and weekly data
type ChartPoint = { key: string; label: string; totalExpenses: number };

// ─── BarChart ──────────────────────────────────────────────────

function BarChart({ data }: { data: ChartPoint[] }) {
  const { colors, radii } = useTheme();
  const max = Math.max(...data.map(d => d.totalExpenses), 1);

  return (
    <View style={styles.barChart}>
      {data.map((item, i) => {
        const isLast = i === data.length - 1;
        const barH = Math.max((item.totalExpenses / max) * 120, 8);
        return (
          <View key={item.key} style={styles.barCol}>
            <ThemedText variant="caption" color={isLast ? colors.accent : colors.textTertiary}>
              {isLast ? formatCurrency(item.totalExpenses) : ''}
            </ThemedText>
            <View style={{ height: 120, justifyContent: 'flex-end', marginVertical: 6 }}>
              <LinearGradient
                colors={isLast ? [colors.accent, colors.accentDim] : [colors.surfaceElevated, colors.surface]}
                style={[
                  { height: barH, width: 32, borderRadius: radii.sm },
                  isLast && { shadowColor: colors.accent, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              />
            </View>
            <ThemedText variant="caption" color={isLast ? colors.accent : colors.textSecondary} bold={isLast}>
              {item.label}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

// ─── DonutSegments ─────────────────────────────────────────────

function DonutSegments({ data }: { data: CategoryBreakdown[] }) {
  const { colors, spacing, radii } = useTheme();

  return (
    <View style={{ gap: spacing.sm }}>
      {data.map(item => (
        <View key={item.categoryId} style={styles.catRow}>
          <View style={[styles.catIcon, { backgroundColor: item.color + '22', borderRadius: radii.md }]}>
            <ThemedText style={{ fontSize: 16 }}>{item.icon}</ThemedText>
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <View style={styles.catLabelRow}>
              <ThemedText variant="bodySm" semibold>{item.name}</ThemedText>
              <ThemedText variant="bodySm" color={colors.textSecondary}>{item.percentage}%</ThemedText>
            </View>
            <View style={[styles.catTrack, { backgroundColor: colors.surfaceElevated, borderRadius: 4, marginTop: 6 }]}>
              <LinearGradient
                colors={[item.color, item.color + '88']}
                style={[styles.catFill, { width: `${item.percentage}%` as any, borderRadius: 4 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
          </View>
          <ThemedText variant="bodySm" semibold style={{ marginLeft: spacing.md, minWidth: 64, textAlign: 'right' }}>
            {formatCurrency(item.amount)}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

// ─── StatsRow ──────────────────────────────────────────────────

function StatsRow({ avgDailySpend, largestAmount, transactionCount }: {
  avgDailySpend: number;
  largestAmount: number;
  transactionCount: number;
}) {
  const { colors, radii } = useTheme();

  const stats = [
    { label: 'Avg / day', value: formatCurrency(avgDailySpend), icon: '📊' },
    { label: 'Largest',   value: formatCurrency(largestAmount), icon: '🔺' },
    { label: 'Txns',      value: `${transactionCount}`,          icon: '📝' },
  ];

  return (
    <View style={styles.statsRow}>
      {stats.map(stat => (
        <View
          key={stat.label}
          style={[styles.statCard, { backgroundColor: colors.surface, borderRadius: radii.xl, borderColor: colors.border, borderWidth: 1 }]}
        >
          <ThemedText style={{ fontSize: 22, marginBottom: 4 }}>{stat.icon}</ThemedText>
          <ThemedText variant="h4" bold>{stat.value}</ThemedText>
          <ThemedText variant="caption" color={colors.textSecondary}>{stat.label}</ThemedText>
        </View>
      ))}
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────

export default function ReportsScreen() {
  const { colors, spacing } = useTheme();
  const [period, setPeriod] = useState<Period>('monthly');

  const now = new Date();
  const { summary, spendingTrend, weeklyTrend, categoryBreakdown, isLoading, refetch } = useReports(
    now.getFullYear(),
    now.getMonth() + 1,
  );

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  // ── Derived chart data ────────────────────────────────────────
  const monthlyChartData: ChartPoint[] = spendingTrend.map(d => ({
    key: `${d.year}-${d.month}`,
    label: d.month,
    totalExpenses: d.totalExpenses,
  }));

  const weeklyChartData: ChartPoint[] = weeklyTrend.map(d => ({
    key: d.weekStart,
    label: d.label,
    totalExpenses: d.totalExpenses,
  }));

  const chartData = period === 'weekly' ? weeklyChartData : monthlyChartData;

  // ── Hero values ───────────────────────────────────────────────
  const isWeekly = period === 'weekly';

  const currentSpend = isWeekly
    ? (weeklyTrend[weeklyTrend.length - 1]?.totalExpenses ?? 0)
    : (summary?.totalExpenses ?? 0);

  const prevSpend = isWeekly
    ? (weeklyTrend[weeklyTrend.length - 2]?.totalExpenses ?? 0)
    : (spendingTrend[spendingTrend.length - 2]?.totalExpenses ?? 0);

  const delta = currentSpend - prevSpend;
  const deltaPercent = prevSpend > 0 ? Math.round(Math.abs(delta / prevSpend) * 100) : 0;

  const heroLabel = isWeekly ? 'THIS WEEK' : MONTH_NAMES[now.getMonth()].toUpperCase();
  const deltaLabel = isWeekly ? 'vs last week' : 'vs last month';
  const trendSectionLabel = isWeekly ? 'PAST 4 WEEKS' : 'SPENDING TREND';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.xl, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <ThemedText variant="h3">Reports</ThemedText>
        <View style={[styles.toggle, { backgroundColor: colors.surface, borderRadius: 999, borderColor: colors.border, borderWidth: 1 }]}>
          {(['weekly', 'monthly'] as Period[]).map(p => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(p)}
              style={[styles.toggleBtn, { borderRadius: 999 }, period === p && { backgroundColor: colors.accent }]}
            >
              <ThemedText variant="label" color={period === p ? colors.textOnAccent : colors.textSecondary}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Hero spend */}
        <LinearGradient
          colors={['#1A1A1A', '#141414']}
          style={[styles.hero, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
        >
          <ThemedText variant="caption" color={colors.textSecondary}>TOTAL SPENT · {heroLabel}</ThemedText>
          <ThemedText variant="display" color={colors.textPrimary} style={{ marginTop: 4, letterSpacing: -2 }}>
            {isLoading ? '—' : formatCurrency(currentSpend)}
          </ThemedText>
          {!isLoading && prevSpend > 0 && (
            <View style={styles.deltaRow}>
              <Badge
                label={`${delta > 0 ? '▲' : '▼'} ${deltaPercent}% ${deltaLabel}`}
                variant={delta > 0 ? 'expense' : 'income'}
              />
              <ThemedText variant="caption" color={colors.textSecondary} style={{ marginLeft: 8 }}>
                {delta > 0 ? `${formatCurrency(delta)} more` : `${formatCurrency(Math.abs(delta))} less`}
              </ThemedText>
            </View>
          )}
        </LinearGradient>

        {isLoading ? (
          <View style={{ paddingTop: 60, alignItems: 'center' }}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : (
          <View style={{ gap: spacing['2xl'], paddingTop: spacing.xl, paddingHorizontal: spacing.xl }}>

            {/* Quick stats — always from current month summary */}
            <StatsRow
              avgDailySpend={summary?.avgDailySpend ?? 0}
              largestAmount={summary?.largestExpense?.amount ?? 0}
              transactionCount={summary?.transactionCount ?? 0}
            />

            {/* Bar chart — weekly or monthly */}
            {chartData.length > 0 && (
              <View>
                <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.md }}>
                  {trendSectionLabel}
                </ThemedText>
                <Card>
                  <BarChart data={chartData} />
                </Card>
              </View>
            )}

            {/* Category breakdown — monthly only */}
            {!isWeekly && categoryBreakdown.length > 0 && (
              <View>
                <View style={[styles.sectionHeader, { marginBottom: spacing.md }]}>
                  <ThemedText variant="label" color={colors.textSecondary}>BY CATEGORY</ThemedText>
                  <ThemedText variant="caption" color={colors.textTertiary}>{MONTH_NAMES[now.getMonth()]}</ThemedText>
                </View>
                <Card>
                  <DonutSegments data={categoryBreakdown} />
                </Card>
              </View>
            )}

            {/* Insight card */}
            {summary && summary.largestExpense && (
              <Card elevated>
                <View style={styles.insightRow}>
                  <ThemedText style={{ fontSize: 28 }}>💡</ThemedText>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <ThemedText variant="bodyLg" semibold style={{ marginBottom: 4 }}>Spending Insight</ThemedText>
                    <ThemedText variant="bodySm" color={colors.textSecondary}>
                      Your largest expense this month was{' '}
                      <ThemedText variant="bodySm" color={colors.warning} semibold>
                        {summary.largestExpense.title}
                      </ThemedText>
                      {' '}at{' '}
                      <ThemedText variant="bodySm" color={colors.expense} semibold>
                        {formatCurrency(summary.largestExpense.amount)}
                      </ThemedText>
                      .
                    </ThemedText>
                  </View>
                </View>
              </Card>
            )}

          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  toggle: { flexDirection: 'row', padding: 3 },
  toggleBtn: { paddingHorizontal: 14, paddingVertical: 6 },
  hero: { paddingHorizontal: 24, paddingVertical: 28 },
  deltaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, alignItems: 'center', padding: 14, gap: 2 },
  barChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  barCol: { alignItems: 'center', flex: 1 },
  catRow: { flexDirection: 'row', alignItems: 'center' },
  catIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  catLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  catTrack: { height: 6 },
  catFill: { height: 6 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  insightRow: { flexDirection: 'row', alignItems: 'flex-start' },
});
