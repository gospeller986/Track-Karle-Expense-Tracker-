import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/constants/mock-data';

type Props = {
  totalIncome: number;
  totalExpenses: number;
  monthlyBudget: number | null;
  monthLabel: string;
};

export function BalanceCard({ totalIncome, totalExpenses, monthlyBudget, monthLabel }: Props) {
  const { colors, spacing, radii } = useTheme();

  const balance = totalIncome - totalExpenses;
  const budgetUsed = monthlyBudget
    ? Math.min((totalExpenses / monthlyBudget) * 100, 100)
    : 0;

  return (
    <View style={{ paddingHorizontal: spacing.xl }}>
      <LinearGradient
        colors={['#1A1A1A', '#222222']}
        style={[styles.card, { borderRadius: radii['2xl'], borderColor: colors.border, borderWidth: 1 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Top row */}
        <View style={styles.top}>
          <View>
            <ThemedText variant="caption" color={colors.textSecondary} style={{ marginBottom: 4 }}>
              NET BALANCE · {monthLabel}
            </ThemedText>
            <ThemedText
              variant="display"
              color={balance >= 0 ? colors.income : colors.expense}
              style={{ letterSpacing: -2 }}
            >
              {formatCurrency(Math.abs(balance))}
            </ThemedText>
          </View>
          <Badge label={balance >= 0 ? 'Surplus' : 'Deficit'} variant={balance >= 0 ? 'income' : 'expense'} />
        </View>

        {/* Income / Expense split */}
        <View style={[styles.split, { borderTopColor: colors.border, borderTopWidth: 1, marginTop: spacing.lg, paddingTop: spacing.lg }]}>
          <View style={styles.splitItem}>
            <View style={[styles.dot, { backgroundColor: colors.income }]} />
            <View>
              <ThemedText variant="caption" color={colors.textSecondary}>Income</ThemedText>
              <ThemedText variant="h4" color={colors.income}>{formatCurrency(totalIncome)}</ThemedText>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.splitItem}>
            <View style={[styles.dot, { backgroundColor: colors.expense }]} />
            <View>
              <ThemedText variant="caption" color={colors.textSecondary}>Spent</ThemedText>
              <ThemedText variant="h4" color={colors.expense}>{formatCurrency(totalExpenses)}</ThemedText>
            </View>
          </View>
        </View>

        {/* Budget bar — only shown when monthlyBudget is set */}
        {monthlyBudget != null && (
          <View style={{ marginTop: spacing.lg }}>
            <View style={styles.budgetLabels}>
              <ThemedText variant="caption" color={colors.textSecondary}>Budget used</ThemedText>
              <ThemedText variant="caption" color={budgetUsed > 80 ? colors.expense : colors.textSecondary}>
                {formatCurrency(totalExpenses)} / {formatCurrency(monthlyBudget)}
              </ThemedText>
            </View>
            <View style={[styles.budgetTrack, { backgroundColor: colors.surfaceElevated, borderRadius: 4 }]}>
              <LinearGradient
                colors={budgetUsed > 80 ? [colors.expense, colors.expenseMuted] : [colors.accent, colors.accentDim]}
                style={[styles.budgetFill, { width: `${budgetUsed}%` as any, borderRadius: 4 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 24 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  split: { flexDirection: 'row', alignItems: 'center' },
  splitItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  divider: { width: 1, height: 32, marginHorizontal: 16 },
  budgetLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  budgetTrack: { height: 6, width: '100%' },
  budgetFill: { height: 6 },
});
