import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/constants/mock-data';
import type { Group } from '@/interfaces/group';

type Props = {
  groups: Group[];
};

export function GroupBalances({ groups }: Props) {
  const { colors, spacing } = useTheme();
  const router = useRouter();

  const withBalance = groups.filter(g => g.yourBalance !== 0);
  if (withBalance.length === 0) return null;

  return (
    <View style={{ paddingHorizontal: spacing.xl }}>
      <View style={styles.header}>
        <ThemedText variant="label" color={colors.textSecondary}>GROUP BALANCES</ThemedText>
        <TouchableOpacity onPress={() => router.push('/groups')}>
          <ThemedText variant="caption" color={colors.accent}>See all →</ThemedText>
        </TouchableOpacity>
      </View>
      <Card padded={false}>
        {withBalance.map((group, idx) => {
          const isLast = idx === withBalance.length - 1;
          const owed = group.yourBalance > 0;
          return (
            <TouchableOpacity
              key={group.id}
              activeOpacity={0.7}
              onPress={() => router.push(`/group/${group.id}` as any)}
              style={[
                styles.row,
                { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
                !isLast && { borderBottomColor: colors.border, borderBottomWidth: 1 },
              ]}
            >
              <View style={[styles.icon, { backgroundColor: colors.secondaryMuted }]}>
                <ThemedText style={{ fontSize: 18, lineHeight: 22 }}>{group.icon}</ThemedText>
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <ThemedText variant="bodySm" semibold>{group.name}</ThemedText>
                <ThemedText variant="caption" color={colors.textSecondary}>
                  {group.memberCount} members
                </ThemedText>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <ThemedText variant="bodySm" semibold color={owed ? colors.income : colors.expense}>
                  {owed ? '+' : '-'}{formatCurrency(Math.abs(group.yourBalance))}
                </ThemedText>
                <ThemedText variant="caption" color={colors.textSecondary}>
                  {owed ? 'owed to you' : 'you owe'}
                </ThemedText>
              </View>
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
