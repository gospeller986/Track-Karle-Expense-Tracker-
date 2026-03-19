import { ScrollView, View, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  EXPENSES, GROUPS, SUBSCRIPTIONS, CATEGORIES,
  getCategoryById, formatCurrency, formatDate, daysUntil,
  USER_PROFILE, MONTHLY_SPENDING,
} from '@/constants/mock-data';

// ─── Sub-components ───────────────────────────────────────────

function Header() {
  const { colors, spacing } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.header, { paddingHorizontal: spacing.xl }]}>
      <View>
        <ThemedText variant="bodySm" color={colors.textSecondary}>
          Good morning 👋
        </ThemedText>
        <ThemedText variant="h3">{USER_PROFILE.name}</ThemedText>
      </View>

      {/* Avatar */}
      <TouchableOpacity
        onPress={() => router.push('/profile')}
        style={[styles.avatar, { backgroundColor: colors.accentMuted, borderColor: colors.accent, borderWidth: 1.5 }]}
      >
        <ThemedText variant="label" color={colors.accent}>
          {USER_PROFILE.initials}
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

function BalanceCard() {
  const { colors, spacing, radii } = useTheme();

  const totalExpenses = EXPENSES
    .filter(e => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = EXPENSES
    .filter(e => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);
  const balance = totalIncome - totalExpenses;

  const budgetUsed = Math.min((totalExpenses / USER_PROFILE.monthlyBudget) * 100, 100);

  return (
    <View style={{ paddingHorizontal: spacing.xl }}>
      <LinearGradient
        colors={['#1A1A1A', '#222222']}
        style={[styles.balanceCard, { borderRadius: radii['2xl'], borderColor: colors.border, borderWidth: 1 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Top row */}
        <View style={styles.balanceTop}>
          <View>
            <ThemedText variant="caption" color={colors.textSecondary} style={{ marginBottom: 4 }}>
              NET BALANCE · MARCH
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
        <View style={[styles.splitRow, { borderTopColor: colors.border, borderTopWidth: 1, marginTop: spacing.lg, paddingTop: spacing.lg }]}>
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

        {/* Budget bar */}
        <View style={{ marginTop: spacing.lg }}>
          <View style={styles.budgetLabelRow}>
            <ThemedText variant="caption" color={colors.textSecondary}>
              Budget used
            </ThemedText>
            <ThemedText variant="caption" color={budgetUsed > 80 ? colors.expense : colors.textSecondary}>
              {formatCurrency(totalExpenses)} / {formatCurrency(USER_PROFILE.monthlyBudget)}
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
      </LinearGradient>
    </View>
  );
}

function QuickActions() {
  const { colors, spacing, radii } = useTheme();
  const router = useRouter();

  const actions = [
    { label: 'Add\nExpense', icon: '＋', color: colors.accent,     textColor: colors.textOnAccent, route: '/expense/add' },
    { label: 'Split\nBill',  icon: '⇄',  color: colors.secondary,  textColor: '#fff',              route: '/groups'      },
    { label: 'Track\nSub',   icon: '○',  color: colors.surface,    textColor: colors.textPrimary,  route: '/subscriptions' },
    { label: 'Reports',      icon: '◎',  color: colors.surface,    textColor: colors.textPrimary,  route: '/reports'     },
  ];

  return (
    <View style={{ paddingHorizontal: spacing.xl }}>
      <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.md }}>
        QUICK ACTIONS
      </ThemedText>
      <View style={styles.actionsRow}>
        {actions.map((a) => (
          <TouchableOpacity
            key={a.label}
            onPress={() => router.push(a.route as any)}
            activeOpacity={0.75}
            style={[
              styles.actionBtn,
              { backgroundColor: a.color, borderRadius: radii.xl, borderColor: colors.border, borderWidth: a.color === colors.surface ? 1 : 0 },
            ]}
          >
            <ThemedText variant="h3" color={a.textColor} style={{ lineHeight: 28 }}>
              {a.icon}
            </ThemedText>
            <ThemedText variant="caption" color={a.textColor} style={{ textAlign: 'center', marginTop: 4 }}>
              {a.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function SpendingMiniChart() {
  const { colors, spacing, radii } = useTheme();
  const max = Math.max(...MONTHLY_SPENDING.map(m => m.amount));

  return (
    <View style={{ paddingHorizontal: spacing.xl }}>
      <View style={styles.sectionHeader}>
        <ThemedText variant="label" color={colors.textSecondary}>SPENDING TREND</ThemedText>
        <ThemedText variant="caption" color={colors.accent}>6 months</ThemedText>
      </View>
      <Card>
        <View style={styles.chartRow}>
          {MONTHLY_SPENDING.map((item, i) => {
            const isLast = i === MONTHLY_SPENDING.length - 1;
            const heightPct = item.amount / max;
            const barH = Math.max(heightPct * 80, 8);
            return (
              <View key={item.month} style={styles.barGroup}>
                <ThemedText variant="caption" color={isLast ? colors.accent : colors.textTertiary}>
                  {formatCurrency(item.amount)}
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

function RecentTransactions() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const recent = EXPENSES.slice(0, 5);

  return (
    <View style={{ paddingHorizontal: spacing.xl }}>
      <View style={styles.sectionHeader}>
        <ThemedText variant="label" color={colors.textSecondary}>RECENT</ThemedText>
        <TouchableOpacity onPress={() => router.push('/expenses')}>
          <ThemedText variant="caption" color={colors.accent}>See all →</ThemedText>
        </TouchableOpacity>
      </View>

      <Card padded={false}>
        {recent.map((expense, idx) => {
          const cat = getCategoryById(expense.categoryId);
          const isLast = idx === recent.length - 1;
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
              {/* Category icon bubble */}
              <View style={[styles.iconBubble, { backgroundColor: cat.color + '22' }]}>
                <ThemedText style={{ fontSize: 18, lineHeight: 22 }}>{cat.icon}</ThemedText>
              </View>

              {/* Title + date */}
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <ThemedText variant="bodySm" semibold>{expense.title}</ThemedText>
                <ThemedText variant="caption" color={colors.textSecondary}>{formatDate(expense.date)}</ThemedText>
              </View>

              {/* Amount */}
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

function UpcomingSubscriptions() {
  const { colors, spacing } = useTheme();
  const router = useRouter();

  const upcoming = SUBSCRIPTIONS.filter(s => daysUntil(s.nextRenewal) <= 7).slice(0, 3);
  if (upcoming.length === 0) return null;

  return (
    <View style={{ paddingHorizontal: spacing.xl }}>
      <View style={styles.sectionHeader}>
        <ThemedText variant="label" color={colors.textSecondary}>RENEWING SOON</ThemedText>
        <TouchableOpacity onPress={() => router.push('/subscriptions')}>
          <ThemedText variant="caption" color={colors.accent}>See all →</ThemedText>
        </TouchableOpacity>
      </View>
      <View style={styles.subRow}>
        {upcoming.map(sub => (
          <TouchableOpacity
            key={sub.id}
            activeOpacity={0.8}
            onPress={() => router.push('/subscriptions')}
            style={[styles.subChip, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
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

function GroupBalances() {
  const { colors, spacing } = useTheme();
  const router = useRouter();

  const hasBalance = GROUPS.filter(g => g.yourBalance !== 0);

  return (
    <View style={{ paddingHorizontal: spacing.xl }}>
      <View style={styles.sectionHeader}>
        <ThemedText variant="label" color={colors.textSecondary}>GROUP BALANCES</ThemedText>
        <TouchableOpacity onPress={() => router.push('/groups')}>
          <ThemedText variant="caption" color={colors.accent}>See all →</ThemedText>
        </TouchableOpacity>
      </View>
      <Card padded={false}>
        {hasBalance.map((group, idx) => {
          const isLast = idx === hasBalance.length - 1;
          const owed = group.yourBalance > 0;
          return (
            <TouchableOpacity
              key={group.id}
              activeOpacity={0.7}
              onPress={() => router.push(`/group/${group.id}` as any)}
              style={[
                styles.txRow,
                { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
                !isLast && { borderBottomColor: colors.border, borderBottomWidth: 1 },
              ]}
            >
              <View style={[styles.iconBubble, { backgroundColor: colors.secondaryMuted }]}>
                <ThemedText style={{ fontSize: 18, lineHeight: 22 }}>{group.icon}</ThemedText>
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <ThemedText variant="bodySm" semibold>{group.name}</ThemedText>
                <ThemedText variant="caption" color={colors.textSecondary}>
                  {group.members.length} members
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

// ─── Main Screen ──────────────────────────────────────────────

export default function HomeScreen() {
  const { colors, spacing } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: spacing['4xl'] }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: spacing['2xl'] }}>
          <Header />
          <BalanceCard />
          <QuickActions />
          <SpendingMiniChart />
          <RecentTransactions />
          <UpcomingSubscriptions />
          <GroupBalances />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceCard: {
    padding: 24,
  },
  balanceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  splitItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  divider: {
    width: 1,
    height: 32,
    marginHorizontal: 16,
  },
  budgetLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  budgetTrack: {
    height: 6,
    width: '100%',
  },
  budgetFill: {
    height: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  barGroup: {
    alignItems: 'center',
    flex: 1,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subRow: {
    flexDirection: 'row',
    gap: 10,
  },
  subChip: {
    flex: 1,
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    gap: 4,
  },
});
