import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, daysUntil } from '@/constants/mock-data';
import type { Subscription } from '@/interfaces/subscription';

type Props = {
  subscriptions: Subscription[];
};

export function UpcomingSubscriptions({ subscriptions }: Props) {
  const { colors, spacing } = useTheme();
  const router = useRouter();

  const upcoming = subscriptions.filter(s => daysUntil(s.nextRenewal) <= 7).slice(0, 3);
  if (upcoming.length === 0) return null;

  return (
    <View style={{ paddingHorizontal: spacing.xl }}>
      <View style={styles.header}>
        <ThemedText variant="label" color={colors.textSecondary}>RENEWING SOON</ThemedText>
        <TouchableOpacity onPress={() => router.push('/subscriptions')}>
          <ThemedText variant="caption" color={colors.accent}>See all →</ThemedText>
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        {upcoming.map(sub => (
          <TouchableOpacity
            key={sub.id}
            activeOpacity={0.8}
            onPress={() => router.push('/subscriptions')}
            style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
          >
            <ThemedText style={{ fontSize: 20 }}>{sub.icon}</ThemedText>
            <ThemedText variant="caption" semibold style={{ marginTop: 4 }}>{sub.name}</ThemedText>
            <ThemedText variant="caption" color={colors.expense}>{formatCurrency(sub.amount)}</ThemedText>
            <Badge label={`${daysUntil(sub.nextRenewal)}d`} variant="warning" size="sm" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 10 },
  chip: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 16, gap: 4 },
});
