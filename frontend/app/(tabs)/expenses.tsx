import { useState } from 'react';
import { ScrollView, View, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EXPENSES, CATEGORIES, getCategoryById, formatCurrency, formatDate } from '@/constants/mock-data';
import type { Expense } from '@/constants/mock-data';

type Filter = 'all' | 'expense' | 'income';

function groupByDate(expenses: Expense[]): Record<string, Expense[]> {
  return expenses.reduce<Record<string, Expense[]>>((acc, e) => {
    const label = formatDate(e.date);
    if (!acc[label]) acc[label] = [];
    acc[label].push(e);
    return acc;
  }, {});
}

export default function ExpensesScreen() {
  const { colors, spacing, radii } = useTheme();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filtered = EXPENSES.filter(e => {
    if (filter !== 'all' && e.type !== filter) return false;
    if (selectedCategory && e.categoryId !== selectedCategory) return false;
    return true;
  });

  const grouped = groupByDate(filtered);
  const totalSpent  = EXPENSES.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const totalIncome = EXPENSES.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <StatusBar barStyle="light-content" />

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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Summary bar */}
        <LinearGradient
          colors={['#1A1A1A', '#141414']}
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
            {(['all', 'expense', 'income'] as Filter[]).map(f => (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: filter === f ? colors.accent : colors.surface,
                    borderColor: filter === f ? colors.accent : colors.border,
                    borderRadius: radii.full,
                    borderWidth: 1,
                  },
                ]}
              >
                <ThemedText
                  variant="label"
                  color={filter === f ? colors.textOnAccent : colors.textSecondary}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Category quick filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 8 }}>
            <TouchableOpacity
              onPress={() => setSelectedCategory(null)}
              style={[
                styles.catPill,
                {
                  backgroundColor: !selectedCategory ? colors.accentMuted : colors.surface,
                  borderColor: !selectedCategory ? colors.accent : colors.border,
                  borderWidth: 1,
                  borderRadius: radii.full,
                },
              ]}
            >
              <ThemedText variant="caption" color={!selectedCategory ? colors.accent : colors.textSecondary}>All</ThemedText>
            </TouchableOpacity>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                style={[
                  styles.catPill,
                  {
                    backgroundColor: selectedCategory === cat.id ? cat.color + '22' : colors.surface,
                    borderColor: selectedCategory === cat.id ? cat.color : colors.border,
                    borderWidth: 1,
                    borderRadius: radii.full,
                  },
                ]}
              >
                <ThemedText style={{ fontSize: 13 }}>{cat.icon}</ThemedText>
                <ThemedText variant="caption" color={selectedCategory === cat.id ? cat.color : colors.textSecondary}>
                  {cat.name.split(' ')[0]}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Grouped transactions */}
          {Object.entries(grouped).map(([date, expenses]) => (
            <View key={date} style={{ paddingHorizontal: spacing.xl }}>
              <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.sm }}>
                {date}
              </ThemedText>
              <Card padded={false}>
                {expenses.map((expense, idx) => {
                  const cat = getCategoryById(expense.categoryId);
                  const isLast = idx === expenses.length - 1;
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
                      <View style={{ alignItems: 'flex-end' }}>
                        <ThemedText
                          variant="bodySm"
                          semibold
                          color={expense.type === 'income' ? colors.income : colors.expense}
                        >
                          {expense.type === 'income' ? '+' : '-'}{formatCurrency(expense.amount)}
                        </ThemedText>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </Card>
            </View>
          ))}

          {filtered.length === 0 && (
            <View style={styles.empty}>
              <ThemedText style={{ fontSize: 48 }}>💸</ThemedText>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  addBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBar: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  summaryItem: { flex: 1, gap: 4 },
  summaryDivider: { width: 1, marginHorizontal: 20 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8 },
  catPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6 },
  txRow: { flexDirection: 'row', alignItems: 'center' },
  iconBubble: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
});
