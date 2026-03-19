import { useState } from 'react';
import { ScrollView, View, TouchableOpacity, StyleSheet, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MONTHLY_SPENDING, CATEGORY_SPENDING, EXPENSES,
  getCategoryById, formatCurrency,
} from '@/constants/mock-data';

const { width: SCREEN_W } = Dimensions.get('window');

type Period = 'weekly' | 'monthly';

function BarChart({ data }: { data: typeof MONTHLY_SPENDING }) {
  const { colors, spacing, radii } = useTheme();
  const max = Math.max(...data.map(d => d.amount));

  return (
    <View style={styles.barChart}>
      {data.map((item, i) => {
        const isLast = i === data.length - 1;
        const pct = item.amount / max;
        const barH = Math.max(pct * 120, 8);

        return (
          <View key={item.month} style={styles.barCol}>
            <ThemedText variant="caption" color={isLast ? colors.accent : colors.textTertiary}>
              {isLast ? formatCurrency(item.amount) : ''}
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
              {item.month}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

function DonutSegments({ data }: { data: typeof CATEGORY_SPENDING }) {
  const { colors, spacing, radii } = useTheme();
  const total = data.reduce((s, d) => s + d.amount, 0);

  return (
    <View style={{ gap: spacing.sm }}>
      {data.map(item => {
        const cat = getCategoryById(item.categoryId);
        return (
          <View key={item.categoryId} style={styles.catRow}>
            {/* Icon */}
            <View style={[styles.catIcon, { backgroundColor: cat.color + '22', borderRadius: radii.md }]}>
              <ThemedText style={{ fontSize: 16 }}>{cat.icon}</ThemedText>
            </View>

            {/* Label + bar */}
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <View style={styles.catLabelRow}>
                <ThemedText variant="bodySm" semibold>{cat.name}</ThemedText>
                <ThemedText variant="bodySm" color={colors.textSecondary}>{item.percentage}%</ThemedText>
              </View>
              <View style={[styles.catTrack, { backgroundColor: colors.surfaceElevated, borderRadius: 4, marginTop: 6 }]}>
                <LinearGradient
                  colors={[cat.color, cat.color + '88']}
                  style={[styles.catFill, { width: `${item.percentage}%` as any, borderRadius: 4 }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
            </View>

            {/* Amount */}
            <ThemedText variant="bodySm" semibold style={{ marginLeft: spacing.md, minWidth: 64, textAlign: 'right' }}>
              {formatCurrency(item.amount)}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

function StatsRow({ period }: { period: Period }) {
  const { colors, spacing, radii } = useTheme();

  const expenses = EXPENSES.filter(e => e.type === 'expense');
  const avg = Math.round(expenses.reduce((s, e) => s + e.amount, 0) / 30);
  const largest = expenses.reduce((max, e) => e.amount > max.amount ? e : max, expenses[0]);

  const stats = [
    { label: 'Avg / day', value: formatCurrency(avg), icon: '📊' },
    { label: 'Largest',   value: formatCurrency(largest?.amount ?? 0), icon: '🔺' },
    { label: 'Txns',      value: `${expenses.length}`, icon: '📝' },
  ];

  return (
    <View style={styles.statsRow}>
      {stats.map(stat => (
        <View
          key={stat.label}
          style={[
            styles.statCard,
            { backgroundColor: colors.surface, borderRadius: radii.xl, borderColor: colors.border, borderWidth: 1 },
          ]}
        >
          <ThemedText style={{ fontSize: 22, marginBottom: 4 }}>{stat.icon}</ThemedText>
          <ThemedText variant="h4" bold>{stat.value}</ThemedText>
          <ThemedText variant="caption" color={colors.textSecondary}>{stat.label}</ThemedText>
        </View>
      ))}
    </View>
  );
}

export default function ReportsScreen() {
  const { colors, spacing, radii } = useTheme();
  const [period, setPeriod] = useState<Period>('monthly');

  const currentMonthSpend = MONTHLY_SPENDING[MONTHLY_SPENDING.length - 1].amount;
  const prevMonthSpend    = MONTHLY_SPENDING[MONTHLY_SPENDING.length - 2].amount;
  const delta = currentMonthSpend - prevMonthSpend;
  const deltaPercent = Math.round(Math.abs(delta / prevMonthSpend) * 100);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.xl, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <ThemedText variant="h3">Reports</ThemedText>

        {/* Period toggle */}
        <View style={[styles.toggle, { backgroundColor: colors.surface, borderRadius: radii.full, borderColor: colors.border, borderWidth: 1 }]}>
          {(['weekly', 'monthly'] as Period[]).map(p => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(p)}
              style={[
                styles.toggleBtn,
                { borderRadius: radii.full },
                period === p && { backgroundColor: colors.accent },
              ]}
            >
              <ThemedText
                variant="label"
                color={period === p ? colors.textOnAccent : colors.textSecondary}
              >
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
          <ThemedText variant="caption" color={colors.textSecondary}>TOTAL SPENT · MARCH</ThemedText>
          <ThemedText variant="display" color={colors.textPrimary} style={{ marginTop: 4, letterSpacing: -2 }}>
            {formatCurrency(currentMonthSpend)}
          </ThemedText>
          <View style={styles.deltaRow}>
            <Badge
              label={`${delta > 0 ? '▲' : '▼'} ${deltaPercent}% vs last month`}
              variant={delta > 0 ? 'expense' : 'income'}
            />
            <ThemedText variant="caption" color={colors.textSecondary} style={{ marginLeft: 8 }}>
              {delta > 0 ? `${formatCurrency(delta)} more` : `${formatCurrency(Math.abs(delta))} less`}
            </ThemedText>
          </View>
        </LinearGradient>

        <View style={{ gap: spacing['2xl'], paddingTop: spacing.xl, paddingHorizontal: spacing.xl }}>

          {/* Quick stats */}
          <StatsRow period={period} />

          {/* Spending trend */}
          <View>
            <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.md }}>
              SPENDING TREND
            </ThemedText>
            <Card>
              <BarChart data={MONTHLY_SPENDING} />
            </Card>
          </View>

          {/* Category breakdown */}
          <View>
            <View style={[styles.sectionHeader, { marginBottom: spacing.md }]}>
              <ThemedText variant="label" color={colors.textSecondary}>BY CATEGORY</ThemedText>
              <ThemedText variant="caption" color={colors.textTertiary}>March</ThemedText>
            </View>
            <Card>
              <DonutSegments data={CATEGORY_SPENDING} />
            </Card>
          </View>

          {/* Insight card */}
          <Card elevated>
            <View style={styles.insightRow}>
              <ThemedText style={{ fontSize: 28 }}>💡</ThemedText>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <ThemedText variant="bodyLg" semibold style={{ marginBottom: 4 }}>Spending Insight</ThemedText>
                <ThemedText variant="bodySm" color={colors.textSecondary}>
                  Your food spending is{' '}
                  <ThemedText variant="bodySm" color={colors.warning} semibold>28%</ThemedText>
                  {' '}of your budget. Consider cooking at home 2 more days a week to save{' '}
                  <ThemedText variant="bodySm" color={colors.income} semibold>~{formatCurrency(800)}</ThemedText>.
                </ThemedText>
              </View>
            </View>
          </Card>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
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
