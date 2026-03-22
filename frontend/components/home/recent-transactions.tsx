import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/constants/mock-data';
import type { Expense } from '@/interfaces/expense';

type Props = {
  expenses: Expense[];
};

export function RecentTransactions({ expenses }: Props) {
  const { colors, spacing } = useTheme();
  const router = useRouter();

  if (expenses.length === 0) return null;

  return (
    <View style={{ paddingHorizontal: spacing.xl }}>
      <View style={styles.header}>
        <ThemedText variant="label" color={colors.textSecondary}>RECENT</ThemedText>
        <TouchableOpacity onPress={() => router.push('/expenses')}>
          <ThemedText variant="caption" color={colors.accent}>See all →</ThemedText>
        </TouchableOpacity>
      </View>

      <Card padded={false}>
        {expenses.map((expense, idx) => {
          const cat = expense.category;
          const isLast = idx === expenses.length - 1;
          return (
            <TouchableOpacity
              key={expense.id}
              activeOpacity={0.7}
              onPress={() => router.push(`/expense/${expense.id}` as any)}
              style={[
                styles.row,
                { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
                !isLast && { borderBottomColor: colors.border, borderBottomWidth: 1 },
              ]}
            >
              <View style={[styles.icon, { backgroundColor: (cat?.color ?? '#888') + '22' }]}>
                <ThemedText style={{ fontSize: 18, lineHeight: 22 }}>{cat?.icon ?? '💰'}</ThemedText>
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <ThemedText variant="bodySm" semibold>{expense.title}</ThemedText>
                <ThemedText variant="caption" color={colors.textSecondary}>{formatDate(expense.date)}</ThemedText>
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
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
