import { ScrollView, View, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GROUPS, GROUP_EXPENSES, GROUP_MEMBERS, formatCurrency } from '@/constants/mock-data';

function MemberAvatars({ members, max = 3 }: { members: typeof GROUP_MEMBERS; max?: number }) {
  const { colors } = useTheme();
  const visible = members.slice(0, max);
  const extra = members.length - max;
  return (
    <View style={styles.avatarStack}>
      {visible.map((m, i) => (
        <View
          key={m.id}
          style={[
            styles.memberAvatar,
            { backgroundColor: colors.secondaryMuted, borderColor: colors.surface, marginLeft: i > 0 ? -10 : 0 },
          ]}
        >
          <ThemedText variant="caption" color={colors.secondary} bold>{m.initials}</ThemedText>
        </View>
      ))}
      {extra > 0 && (
        <View style={[styles.memberAvatar, { backgroundColor: colors.surfaceElevated, borderColor: colors.surface, marginLeft: -10 }]}>
          <ThemedText variant="caption" color={colors.textSecondary}>+{extra}</ThemedText>
        </View>
      )}
    </View>
  );
}

export default function GroupsScreen() {
  const { colors, spacing, radii } = useTheme();
  const router = useRouter();

  const totalOwed  = GROUPS.filter(g => g.yourBalance > 0).reduce((s, g) => s + g.yourBalance, 0);
  const totalOwe   = GROUPS.filter(g => g.yourBalance < 0).reduce((s, g) => s + Math.abs(g.yourBalance), 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.xl, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <ThemedText variant="h3">Groups</ThemedText>
        <TouchableOpacity
          onPress={() => router.push('/group/create')}
          style={[styles.addBtn, { backgroundColor: colors.secondary, borderRadius: radii.full }]}
        >
          <ThemedText variant="h4" color="#fff">＋</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Balance summary */}
        <LinearGradient
          colors={['#1A1A1A', '#141414']}
          style={[styles.summaryBar, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
        >
          <View style={styles.summaryItem}>
            <ThemedText variant="caption" color={colors.textSecondary}>You're owed</ThemedText>
            <ThemedText variant="h3" color={colors.income}>{formatCurrency(totalOwed)}</ThemedText>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <ThemedText variant="caption" color={colors.textSecondary}>You owe</ThemedText>
            <ThemedText variant="h3" color={colors.expense}>{formatCurrency(totalOwe)}</ThemedText>
          </View>
        </LinearGradient>

        <View style={{ gap: spacing.xl, paddingTop: spacing.xl, paddingHorizontal: spacing.xl }}>

          {/* Groups list */}
          <View>
            <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.md }}>
              YOUR GROUPS
            </ThemedText>
            <View style={{ gap: spacing.md }}>
              {GROUPS.map(group => {
                const owed = group.yourBalance > 0;
                const settled = group.yourBalance === 0;
                const recentExpenses = GROUP_EXPENSES.filter(e => e.groupId === group.id && !e.settled);

                return (
                  <Card key={group.id} onPress={() => router.push(`/group/${group.id}` as any)} elevated={false}>
                    {/* Top row */}
                    <View style={styles.groupTop}>
                      <View style={[styles.groupIcon, { backgroundColor: colors.secondaryMuted, borderRadius: radii.lg }]}>
                        <ThemedText style={{ fontSize: 24 }}>{group.icon}</ThemedText>
                      </View>
                      <View style={{ flex: 1, marginLeft: spacing.md }}>
                        <ThemedText variant="bodyLg" semibold>{group.name}</ThemedText>
                        <ThemedText variant="caption" color={colors.textSecondary}>
                          {group.members.length} members · {formatCurrency(group.totalExpenses)} total
                        </ThemedText>
                      </View>
                      {!settled && (
                        <Badge
                          label={`${owed ? '+' : '-'}${formatCurrency(Math.abs(group.yourBalance))}`}
                          variant={owed ? 'income' : 'expense'}
                        />
                      )}
                    </View>

                    {/* Member avatars + pending */}
                    <View style={[styles.groupBottom, { marginTop: spacing.md, paddingTop: spacing.md, borderTopColor: colors.border, borderTopWidth: 1 }]}>
                      <MemberAvatars members={group.members} />
                      {recentExpenses.length > 0 && (
                        <ThemedText variant="caption" color={colors.textSecondary}>
                          {recentExpenses.length} unsettled
                        </ThemedText>
                      )}
                      {settled && (
                        <Badge label="All settled" variant="income" size="sm" />
                      )}
                    </View>
                  </Card>
                );
              })}
            </View>
          </View>

          {/* Friends balance summary */}
          <View>
            <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.md }}>
              PEOPLE
            </ThemedText>
            <Card padded={false}>
              {GROUP_MEMBERS.filter(m => m.id !== 'u1').map((member, idx, arr) => {
                // Calculate net balance with this person across all groups
                const balance = GROUPS.reduce((sum, g) => {
                  if (!g.members.find(m => m.id === member.id)) return sum;
                  return sum + (g.yourBalance / g.members.length);
                }, 0);
                const isLast = idx === arr.length - 1;

                return (
                  <View
                    key={member.id}
                    style={[
                      styles.personRow,
                      { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
                      !isLast && { borderBottomColor: colors.border, borderBottomWidth: 1 },
                    ]}
                  >
                    <View style={[styles.personAvatar, { backgroundColor: colors.secondaryMuted }]}>
                      <ThemedText variant="label" color={colors.secondary}>{member.initials}</ThemedText>
                    </View>
                    <ThemedText variant="bodySm" semibold style={{ flex: 1, marginLeft: spacing.md }}>
                      {member.name}
                    </ThemedText>
                    {balance !== 0 && (
                      <ThemedText
                        variant="bodySm"
                        semibold
                        color={balance > 0 ? colors.income : colors.expense}
                      >
                        {balance > 0 ? '+' : ''}{formatCurrency(Math.round(balance))}
                      </ThemedText>
                    )}
                    {balance === 0 && (
                      <ThemedText variant="caption" color={colors.textTertiary}>settled</ThemedText>
                    )}
                  </View>
                );
              })}
            </Card>
          </View>

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
  groupTop: { flexDirection: 'row', alignItems: 'center' },
  groupIcon: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  groupBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avatarStack: { flexDirection: 'row', alignItems: 'center' },
  memberAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personRow: { flexDirection: 'row', alignItems: 'center' },
  personAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
