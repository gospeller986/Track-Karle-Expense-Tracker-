import { useCallback } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { useUser } from '@/hooks/use-user';
import { useExpenses } from '@/hooks/use-expenses';
import { useSubscriptions } from '@/hooks/use-subscriptions';
import { useGroups } from '@/hooks/use-groups';
import { useReports } from '@/hooks/use-reports';
import { ThemedText } from '@/components/themed-text';
import { BalanceCard } from '@/components/home/balance-card';
import { SpendingMiniChart } from '@/components/home/spending-mini-chart';
import { RecentTransactions } from '@/components/home/recent-transactions';
import { UpcomingSubscriptions } from '@/components/home/upcoming-subscriptions';
import { GroupBalances } from '@/components/home/group-balances';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ─── Header ───────────────────────────────────────────────────

function Header({ name, initials }: { name: string; initials: string }) {
  const { colors, spacing } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.header, { paddingHorizontal: spacing.xl }]}>
      <View>
        <ThemedText variant="bodySm" color={colors.textSecondary}>Good morning 👋</ThemedText>
        <ThemedText variant="h3">{name || '…'}</ThemedText>
      </View>
      <TouchableOpacity
        onPress={() => router.push('/profile')}
        style={[styles.avatar, { backgroundColor: colors.accentMuted, borderColor: colors.accent, borderWidth: 1.5 }]}
      >
        <ThemedText variant="label" color={colors.accent}>{initials}</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

// ─── QuickActions ─────────────────────────────────────────────

function QuickActions() {
  const { colors, spacing, radii } = useTheme();
  const router = useRouter();

  const actions = [
    { label: 'Add\nExpense', icon: '＋', color: colors.accent,    textColor: colors.textOnAccent, route: '/expense/add'     },
    { label: 'Split\nBill',  icon: '⇄',  color: colors.secondary, textColor: '#fff',              route: '/groups'          },
    { label: 'Track\nSub',   icon: '○',  color: colors.surface,   textColor: colors.textPrimary,  route: '/subscriptions'   },
    { label: 'Reports',      icon: '◎',  color: colors.surface,   textColor: colors.textPrimary,  route: '/reports'         },
  ];

  return (
    <View style={{ paddingHorizontal: spacing.xl }}>
      <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.md }}>
        QUICK ACTIONS
      </ThemedText>
      <View style={styles.actionsRow}>
        {actions.map(a => (
          <TouchableOpacity
            key={a.label}
            onPress={() => router.push(a.route as any)}
            activeOpacity={0.75}
            style={[
              styles.actionBtn,
              { backgroundColor: a.color, borderRadius: radii.xl, borderColor: colors.border, borderWidth: a.color === colors.surface ? 1 : 0 },
            ]}
          >
            <ThemedText variant="h3" color={a.textColor} style={{ lineHeight: 28 }}>{a.icon}</ThemedText>
            <ThemedText variant="caption" color={a.textColor} style={{ textAlign: 'center', marginTop: 4 }}>{a.label}</ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────

export default function HomeScreen() {
  const { colors, spacing } = useTheme();

  const now = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth() + 1;

  // First day / last day of current month for filtering
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay   = new Date(year, month, 0).getDate();
  const endDate   = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const { user, initials, refetch: refetchUser }           = useUser();
  const { summary, spendingTrend, refetch: refetchReports } = useReports(year, month);
  const { expenses: recent, refetch: refetchExpenses }      = useExpenses({ limit: 5 });
  const { subscriptions, refetch: refetchSubs }             = useSubscriptions();
  const { groups, refetch: refetchGroups }                  = useGroups();

  useFocusEffect(useCallback(() => {
    refetchUser();
    refetchReports();
    refetchExpenses();
    refetchSubs();
    refetchGroups();
  }, [refetchUser, refetchReports, refetchExpenses, refetchSubs, refetchGroups]));

  const monthLabel = MONTH_NAMES[now.getMonth()].toUpperCase();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: spacing['4xl'] }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: spacing['2xl'] }}>
          <Header name={user?.name ?? ''} initials={initials} />
          <BalanceCard
            totalIncome={summary?.totalIncome ?? 0}
            totalExpenses={summary?.totalExpenses ?? 0}
            monthlyBudget={user?.monthlyBudget ?? null}
            monthLabel={monthLabel}
          />
          <QuickActions />
          <SpendingMiniChart data={spendingTrend} />
          <RecentTransactions expenses={recent} />
          <UpcomingSubscriptions subscriptions={subscriptions} />
          <GroupBalances groups={groups} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 8 },
});
