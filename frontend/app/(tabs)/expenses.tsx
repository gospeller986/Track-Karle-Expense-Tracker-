import { useCallback, useMemo, useState } from 'react';
import {
  ScrollView, View, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { useCategories } from '@/hooks/use-categories';
import { useExpenses } from '@/hooks/use-expenses';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/constants/mock-data';
import type { ExpenseFilter } from '@/types/expense';
import type { Expense } from '@/interfaces/expense';

// Current-month ISO date bounds
function currentMonthRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
  return {
    startDate: `${y}-${m}-01`,
    endDate:   `${y}-${m}-${String(lastDay).padStart(2, '0')}`,
  };
}

function groupByDate(expenses: Expense[]): Record<string, Expense[]> {
  return expenses.reduce<Record<string, Expense[]>>((acc, e) => {
    const label = formatDate(e.date);
    if (!acc[label]) acc[label] = [];
    acc[label].push(e);
    return acc;
  }, {});
}

export default function ExpensesScreen() {
  const { colors, spacing, radii, isDark } = useTheme();
  const router = useRouter();

  const [typeFilter, setTypeFilter]       = useState<ExpenseFilter>('all');
  const [selectedCat, setSelectedCat]     = useState<string | null>(null);

  const { startDate, endDate } = currentMonthRange();

  // Fetch all current-month expenses (client-side filter for type/category)
  const { expenses, isLoading, refetch } = useExpenses({
    startDate,
    endDate,
    limit: 100,
  });

  const { categories } = useCategories();

  // Refetch whenever this tab comes back into focus (e.g. after adding an expense)
  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  const filtered = useMemo(() => expenses.filter(e => {
    if (typeFilter !== 'all' && e.type !== typeFilter) return false;
    if (selectedCat && e.categoryId !== selectedCat) return false;
    return true;
  }), [expenses, typeFilter, selectedCat]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  const totalSpent  = useMemo(
    () => expenses.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0),
    [expenses],
  );
  const totalIncome = useMemo(
    () => expenses.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0),
    [expenses],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.xl, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <ThemedText variant="h3">Expenses</ThemedText>
        <TouchableOpacity
          onPress={() => router.push('/expense/add' as any)}
          style={[styles.addBtn, { backgroundColor: colors.accent, borderRadius: radii.full }]}
        >
          <ThemedText variant="h4" color={colors.textOnAccent}>＋</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Summary bar */}
        <LinearGradient
          colors={isDark ? ['#1A1A1A', '#141414'] : [colors.bgElevated, colors.surface]}
          style={[styles.summaryBar, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
        >
          <View style={styles.summaryItem}>
            <ThemedText variant="caption" color={colors.textSecondary}>Spent this month</ThemedText>
            <ThemedText variant="h3" color={colors.expense}>{formatCurrency(totalSpent)}</ThemedText>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <ThemedText variant="caption" color={colors.textSecondary}>Income this month</ThemedText>
            <ThemedText variant="h3" color={colors.income}>{formatCurrency(totalIncome)}</ThemedText>
          </View>
        </LinearGradient>

        <View style={{ gap: spacing.lg, paddingTop: spacing.xl }}>

          {/* Type filter pills */}
          <View style={[styles.filterRow, { paddingHorizontal: spacing.xl }]}>
            {(['all', 'expense', 'income'] as ExpenseFilter[]).map(f => (
              <TouchableOpacity
                key={f}
                onPress={() => setTypeFilter(f)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: typeFilter === f ? colors.accent : colors.surface,
                    borderColor:     typeFilter === f ? colors.accent : colors.border,
                    borderRadius: radii.full,
                    borderWidth: 1,
                  },
                ]}
              >
                <ThemedText
                  variant="label"
                  color={typeFilter === f ? colors.textOnAccent : colors.textSecondary}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Category quick filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 8 }}
          >
            <TouchableOpacity
              onPress={() => setSelectedCat(null)}
              style={[
                styles.catPill,
                {
                  backgroundColor: !selectedCat ? colors.accentMuted : colors.surface,
                  borderColor:     !selectedCat ? colors.accent : colors.border,
                  borderWidth: 1,
                  borderRadius: radii.full,
                },
              ]}
            >
              <ThemedText variant="caption" color={!selectedCat ? colors.accent : colors.textSecondary}>
                All
              </ThemedText>
            </TouchableOpacity>

            {categories.map(cat => {
              const active = selectedCat === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setSelectedCat(active ? null : cat.id)}
                  style={[
                    styles.catPill,
                    {
                      backgroundColor: active ? cat.color + '22' : colors.surface,
                      borderColor:     active ? cat.color : colors.border,
                      borderWidth: 1,
                      borderRadius: radii.full,
                    },
                  ]}
                >
                  <ThemedText style={{ fontSize: 13 }}>{cat.icon}</ThemedText>
                  <ThemedText variant="caption" color={active ? cat.color : colors.textSecondary}>
                    {cat.name.split(' ')[0]}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Loading state */}
          {isLoading && (
            <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
          )}

          {/* Grouped transactions */}
          {!isLoading && Object.entries(grouped).map(([date, dayExpenses]) => (
            <View key={date} style={{ paddingHorizontal: spacing.xl }}>
              <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.sm }}>
                {date}
              </ThemedText>
              <Card padded={false}>
                {dayExpenses.map((expense, idx) => {
                  const cat = expense.category;
                  const isLast = idx === dayExpenses.length - 1;
                  return (
                    <TouchableOpacity
                      key={expense.id}
                      activeOpacity={0.7}
                      onPress={() => router.push(`/expense/${expense.id}` as any)}
                      style={[
                        styles.txRow,
                        { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
                        !isLast && { borderBottomColor: colors.border, borderBottomWidth: 1 },
                      ]}
                    >
                      <View style={[styles.iconBubble, { backgroundColor: cat.color + '22' }]}>
                        <ThemedText style={{ fontSize: 18, lineHeight: 22 }}>{cat.icon}</ThemedText>
                      </View>
                      <View style={{ flex: 1, marginLeft: spacing.md }}>
                        <ThemedText variant="bodySm" semibold>{expense.title}</ThemedText>
                        <ThemedText variant="caption" color={colors.textSecondary}>{cat.name}</ThemedText>
                      </View>
                      <ThemedText
                        variant="bodySm"
                        semibold
                        color={expense.type === 'income' ? colors.income : colors.expense}
                      >
                        {expense.type === 'income' ? '+' : '-'}{formatCurrency(expense.amount)}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </Card>
            </View>
          ))}

          {!isLoading && filtered.length === 0 && (
            <View style={styles.empty}>
              <ThemedText style={{ fontSize: 48 , paddingTop : 30 }}>💸</ThemedText>
              <ThemedText variant="h4" style={{ marginTop: 16 }}>No transactions</ThemedText>
              <ThemedText variant="body" color={colors.textSecondary} style={{ marginTop: 8, textAlign: 'center' }}>
                Try a different filter or add your first expense
              </ThemedText>
            </View>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  addBtn:         { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  summaryBar:     { flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 20 },
  summaryItem:    { flex: 1, gap: 4 },
  summaryDivider: { width: 1, marginHorizontal: 20 },
  filterRow:      { flexDirection: 'row', gap: 8 },
  filterPill:     { paddingHorizontal: 16, paddingVertical: 8 },
  catPill:        { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6 },
  txRow:          { flexDirection: 'row', alignItems: 'center' },
  iconBubble:     { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  empty:          { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
});
