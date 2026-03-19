import { View, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EXPENSES, getCategoryById, formatCurrency, formatDate } from '@/constants/mock-data';

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radii } = useTheme();
  const router = useRouter();

  const expense = EXPENSES.find(e => e.id === id) ?? EXPENSES[0];
  const cat = getCategoryById(expense.categoryId);
  const isIncome = expense.type === 'income';
  const amountColor = isIncome ? colors.income : colors.expense;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.xl, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ThemedText variant="bodyLg" color={colors.textSecondary}>‹ Back</ThemedText>
        </TouchableOpacity>
        <ThemedText variant="h4">Detail</ThemedText>
        <TouchableOpacity onPress={() => Alert.alert('Edit', 'Edit expense')}>
          <ThemedText variant="bodyLg" color={colors.accent}>Edit</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Hero amount */}
        <LinearGradient
          colors={['#1A1A1A', '#141414']}
          style={[styles.hero, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
        >
          <View style={[styles.iconBubble, { backgroundColor: cat.color + '22', borderRadius: radii['2xl'] }]}>
            <ThemedText style={{ fontSize: 40 }}>{cat.icon}</ThemedText>
          </View>
          <ThemedText variant="h3" style={{ marginTop: spacing.md }}>{expense.title}</ThemedText>
          <ThemedText
            variant="display"
            color={amountColor}
            style={{ marginTop: spacing.sm, letterSpacing: -2 }}
          >
            {isIncome ? '+' : '-'}{formatCurrency(expense.amount)}
          </ThemedText>
          <Badge label={isIncome ? 'Income' : 'Expense'} variant={isIncome ? 'income' : 'expense'} />
        </LinearGradient>

        {/* Details */}
        <View style={{ padding: spacing.xl, gap: spacing.md }}>
          <Card padded={false}>
            {[
              { label: 'Category', value: cat.name,               icon: cat.icon },
              { label: 'Date',     value: formatDate(expense.date), icon: '📅' },
              { label: 'Type',     value: expense.type.charAt(0).toUpperCase() + expense.type.slice(1), icon: isIncome ? '▲' : '▼' },
            ].map((row, idx, arr) => (
              <View
                key={row.label}
                style={[
                  styles.detailRow,
                  { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
                  idx < arr.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 },
                ]}
              >
                <ThemedText variant="bodySm" color={colors.textSecondary}>{row.label}</ThemedText>
                <View style={styles.detailValue}>
                  <ThemedText style={{ fontSize: 16 }}>{row.icon}</ThemedText>
                  <ThemedText variant="bodySm" semibold style={{ marginLeft: 6 }}>{row.value}</ThemedText>
                </View>
              </View>
            ))}
          </Card>

          {/* Delete button */}
          <TouchableOpacity
            onPress={() => { router.back(); }}
            style={[styles.deleteBtn, { backgroundColor: colors.expenseMuted, borderRadius: radii.lg, borderColor: colors.expense, borderWidth: 1 }]}
          >
            <ThemedText variant="label" color={colors.expense}>🗑  Delete Transaction</ThemedText>
          </TouchableOpacity>
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
  hero: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
    gap: 10,
  },
  iconBubble: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailValue: { flexDirection: 'row', alignItems: 'center' },
  deleteBtn: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
});
