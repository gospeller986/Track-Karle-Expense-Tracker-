import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/constants/mock-data';
import type { MonthlyTrend } from '@/interfaces/reports';

type Props = {
  data: MonthlyTrend[];
};

export function SpendingMiniChart({ data }: Props) {
  const { colors, spacing, radii } = useTheme();

  if (data.length === 0) return null;

  const max = Math.max(...data.map(d => d.totalExpenses), 1);

  return (
    <View style={{ paddingHorizontal: spacing.xl }}>
      <View style={styles.header}>
        <ThemedText variant="label" color={colors.textSecondary}>SPENDING TREND</ThemedText>
        <ThemedText variant="caption" color={colors.accent}>6 months</ThemedText>
      </View>
      <Card>
        <View style={styles.chartRow}>
          {data.map((item, i) => {
            const isLast = i === data.length - 1;
            const barH = Math.max((item.totalExpenses / max) * 80, 8);
            return (
              <View key={`${item.year}-${item.month}`} style={styles.barGroup}>
                <ThemedText variant="caption" color={isLast ? colors.accent : colors.textTertiary}>
                  {isLast ? formatCurrency(item.totalExpenses) : ''}
                </ThemedText>
                <View style={{ height: 80, justifyContent: 'flex-end', marginTop: 4 }}>
                  <LinearGradient
                    colors={isLast ? [colors.accent, colors.accentDim] : [colors.surfaceElevated, colors.surface]}
                    style={{ height: barH, width: 28, borderRadius: radii.sm }}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                  />
                </View>
                <ThemedText variant="caption" color={isLast ? colors.accent : colors.textTertiary} style={{ marginTop: 4 }}>
                  {item.month}
                </ThemedText>
              </View>
            );
          })}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  barGroup: { alignItems: 'center', flex: 1 },
});
