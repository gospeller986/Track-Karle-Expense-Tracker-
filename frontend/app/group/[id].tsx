import { useState } from 'react';
import { ScrollView, View, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  GROUPS, GROUP_EXPENSES, GROUP_MEMBERS,
  getCategoryById, formatCurrency, formatDate,
} from '@/constants/mock-data';
import type { GroupExpense, SplitType } from '@/constants/mock-data';

// ─── Helpers ──────────────────────────────────────────────────

const SPLIT_LABEL: Record<SplitType, string> = {
  equal:      'Equal',
  unequal:    'Unequal',
  percentage: 'By %',
};

function getMemberById(id: string) {
  return GROUP_MEMBERS.find(m => m.id === id);
}

function getYourShare(expense: GroupExpense): number {
  const myId = 'u1';
  if (!expense.splitWith.includes(myId)) return 0;
  if (expense.splitType === 'equal') {
    return expense.amount / expense.splitWith.length;
  }
  return expense.splits?.find(s => s.memberId === myId)?.amount ?? 0;
}

// ─── Member Avatar row ────────────────────────────────────────

const AVATAR_COLORS = ['#C9F31D', '#7B61FF', '#FF4D4D', '#00C48C', '#FF8A00', '#4D9EFF'];

function MemberAvatarStack({ memberIds, max = 4 }: { memberIds: string[]; max?: number }) {
  const { colors } = useTheme();
  const visible = memberIds.slice(0, max);
  const extra   = memberIds.length - max;

  return (
    <View style={{ flexDirection: 'row' }}>
      {visible.map((id, i) => {
        const m = getMemberById(id);
        const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
        return (
          <View
            key={id}
            style={[
              styles.stackAvatar,
              { backgroundColor: color + '22', borderColor: colors.surface, marginLeft: i > 0 ? -8 : 0 },
            ]}
          >
            <ThemedText variant="caption" color={color} bold>{m?.initials ?? '??'}</ThemedText>
          </View>
        );
      })}
      {extra > 0 && (
        <View style={[styles.stackAvatar, { backgroundColor: colors.surfaceElevated, borderColor: colors.surface, marginLeft: -8 }]}>
          <ThemedText variant="caption" color={colors.textSecondary}>+{extra}</ThemedText>
        </View>
      )}
    </View>
  );
}

// ─── Balance chip per member ──────────────────────────────────

function MemberBalanceRow({ memberId, groupId, index }: { memberId: string; groupId: string; index: number }) {
  const { colors, spacing, radii } = useTheme();
  const member = getMemberById(memberId);
  const color  = AVATAR_COLORS[index % AVATAR_COLORS.length];

  // Compute net balance for this member from all expenses
  const expenses = GROUP_EXPENSES.filter(e => e.groupId === groupId && !e.settled);
  let paid = 0;
  let owes = 0;
  expenses.forEach(exp => {
    if (exp.paidBy === memberId) paid += exp.amount;
    if (exp.splitWith.includes(memberId)) {
      if (exp.splitType === 'equal') owes += exp.amount / exp.splitWith.length;
      else owes += exp.splits?.find(s => s.memberId === memberId)?.amount ?? 0;
    }
  });
  const net = paid - owes; // positive = owed to them

  return (
    <View style={[styles.memberBalRow, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
      <View style={[styles.memberAvatar, { backgroundColor: color + '22' }]}>
        <ThemedText variant="caption" color={color} bold>{member?.initials}</ThemedText>
      </View>
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <ThemedText variant="bodySm" semibold>{memberId === 'u1' ? 'You' : member?.name}</ThemedText>
        <ThemedText variant="caption" color={colors.textSecondary}>
          Paid {formatCurrency(paid)}
        </ThemedText>
      </View>
      {net === 0 ? (
        <ThemedText variant="caption" color={colors.textTertiary}>settled up</ThemedText>
      ) : (
        <View style={{ alignItems: 'flex-end' }}>
          <ThemedText variant="bodySm" semibold color={net > 0 ? colors.income : colors.expense}>
            {net > 0 ? 'gets back' : 'owes'} {formatCurrency(Math.abs(net))}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

// ─── Expense row ─────────────────────────────────────────────

function ExpenseRow({ expense, isLast }: { expense: GroupExpense; isLast: boolean }) {
  const { colors, spacing, radii } = useTheme();
  const payer    = getMemberById(expense.paidBy);
  const cat      = getCategoryById(expense.categoryId);
  const myShare  = getYourShare(expense);
  const iAmPayer = expense.paidBy === 'u1';

  return (
    <View
      style={[
        styles.expRow,
        { paddingHorizontal: spacing.lg, paddingVertical: spacing.md + 2 },
        !isLast && { borderBottomColor: colors.border, borderBottomWidth: 1 },
        expense.settled && { opacity: 0.5 },
      ]}
    >
      {/* Category icon */}
      <View style={[styles.catIcon, { backgroundColor: cat.color + '22', borderRadius: radii.lg }]}>
        <ThemedText style={{ fontSize: 18 }}>{cat.icon}</ThemedText>
      </View>

      {/* Middle info */}
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <ThemedText variant="bodySm" semibold numberOfLines={1} style={{ flex: 1 }}>
            {expense.title}
          </ThemedText>
          <Badge label={SPLIT_LABEL[expense.splitType]} variant="neutral" size="sm" />
        </View>
        <ThemedText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
          {formatDate(expense.date)} · paid by {iAmPayer ? 'you' : payer?.name}
        </ThemedText>
        <MemberAvatarStack memberIds={expense.splitWith} max={5} />
      </View>

      {/* Right: total + your share */}
      <View style={{ alignItems: 'flex-end', marginLeft: spacing.sm }}>
        <ThemedText variant="bodySm" bold>{formatCurrency(expense.amount)}</ThemedText>
        {myShare > 0 && (
          <ThemedText
            variant="caption"
            color={iAmPayer ? colors.income : colors.expense}
          >
            {iAmPayer ? `+${formatCurrency(expense.amount - myShare)}` : `-${formatCurrency(myShare)}`}
          </ThemedText>
        )}
        {expense.settled && (
          <ThemedText variant="caption" color={colors.textTertiary}>settled</ThemedText>
        )}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radii } = useTheme();
  const router = useRouter();

  const [showSettled, setShowSettled] = useState(false);

  const group = GROUPS.find(g => g.id === id) ?? GROUPS[0];
  const allExpenses   = GROUP_EXPENSES.filter(e => e.groupId === group.id);
  const unsettled     = allExpenses.filter(e => !e.settled);
  const settled       = allExpenses.filter(e => e.settled);
  const displayList   = showSettled ? allExpenses : unsettled;

  const owed    = group.yourBalance > 0;
  const settled_ = group.yourBalance === 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.xl, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <ThemedText variant="h4">{group.icon} {group.name}</ThemedText>
          <ThemedText variant="caption" color={colors.textSecondary}>{group.members.length} members</ThemedText>
        </View>
        {/* Add expense */}
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/group/add-expense', params: { groupId: group.id } })}
          style={[styles.addBtn, { backgroundColor: colors.secondary, borderRadius: radii.full }]}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Hero balance card */}
        <LinearGradient
          colors={['#1A1A1A', '#141414']}
          style={[styles.hero, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
        >
          <View style={{ alignItems: 'center' }}>
            <ThemedText variant="caption" color={colors.textSecondary}>YOUR BALANCE</ThemedText>
            {settled_ ? (
              <ThemedText variant="h2" color={colors.income} style={{ marginTop: 4 }}>All settled up ✓</ThemedText>
            ) : (
              <>
                <ThemedText
                  variant="display"
                  color={owed ? colors.income : colors.expense}
                  style={{ marginTop: 4, letterSpacing: -2 }}
                >
                  {formatCurrency(Math.abs(group.yourBalance))}
                </ThemedText>
                <ThemedText variant="bodySm" color={colors.textSecondary} style={{ marginTop: 4 }}>
                  {owed ? 'the group owes you' : 'you owe the group'}
                </ThemedText>
              </>
            )}
          </View>

          {/* Settle up button */}
          {!settled_ && (
            <TouchableOpacity
              style={[
                styles.settleBtn,
                { backgroundColor: owed ? colors.incomeMuted : colors.expenseMuted, borderRadius: radii.xl,
                  borderColor: owed ? colors.income : colors.expense, borderWidth: 1 },
              ]}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color={owed ? colors.income : colors.expense} />
              <ThemedText variant="label" color={owed ? colors.income : colors.expense} style={{ marginLeft: 6 }}>
                Settle Up
              </ThemedText>
            </TouchableOpacity>
          )}

          {/* Group total */}
          <ThemedText variant="caption" color={colors.textTertiary} style={{ marginTop: spacing.md }}>
            Total group spend: {formatCurrency(group.totalExpenses)}
          </ThemedText>
        </LinearGradient>

        <View style={{ gap: spacing.xl, paddingTop: spacing.xl }}>

          {/* Member balances */}
          <View style={{ paddingHorizontal: spacing.xl }}>
            <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.md }}>
              MEMBER BALANCES
            </ThemedText>
            <Card padded={false}>
              {group.members.map((member, idx) => (
                <View
                  key={member.id}
                  style={idx < group.members.length - 1 ? { borderBottomColor: colors.border, borderBottomWidth: 1 } : undefined}
                >
                  <MemberBalanceRow memberId={member.id} groupId={group.id} index={idx} />
                </View>
              ))}
            </Card>
          </View>

          {/* Expenses list */}
          <View style={{ paddingHorizontal: spacing.xl }}>
            <View style={styles.sectionHeader}>
              <ThemedText variant="label" color={colors.textSecondary}>
                EXPENSES
                {unsettled.length > 0 && (
                  <ThemedText variant="label" color={colors.expense}> · {unsettled.length} unsettled</ThemedText>
                )}
              </ThemedText>
              {settled.length > 0 && (
                <TouchableOpacity onPress={() => setShowSettled(v => !v)}>
                  <ThemedText variant="caption" color={colors.accent}>
                    {showSettled ? 'Hide settled' : `Show settled (${settled.length})`}
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>

            {displayList.length > 0 ? (
              <Card padded={false}>
                {displayList.map((exp, idx) => (
                  <ExpenseRow key={exp.id} expense={exp} isLast={idx === displayList.length - 1} />
                ))}
              </Card>
            ) : (
              <View style={styles.emptyBox}>
                <ThemedText style={{ fontSize: 40 }}>🧾</ThemedText>
                <ThemedText variant="h4" style={{ marginTop: 12 }}>No expenses yet</ThemedText>
                <ThemedText variant="body" color={colors.textSecondary} style={{ marginTop: 6, textAlign: 'center' }}>
                  Tap + to add the first expense for this group
                </ThemedText>
              </View>
            )}
          </View>

        </View>
      </ScrollView>

      {/* Floating Add Expense CTA */}
      <View style={[styles.fab, { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl }]}>
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/group/add-expense', params: { groupId: group.id } })}
          activeOpacity={0.85}
          style={[styles.fabBtn, { backgroundColor: colors.secondary, borderRadius: radii.xl }]}
        >
          <Ionicons name="add-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <ThemedText variant="bodyLg" bold color="#fff">Add Group Expense</ThemedText>
        </TouchableOpacity>
      </View>
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
  addBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  hero: { paddingHorizontal: 24, paddingVertical: 28, alignItems: 'center', gap: 12 },
  settleBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10 },
  memberBalRow: { flexDirection: 'row', alignItems: 'center' },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  expRow: { flexDirection: 'row', alignItems: 'center' },
  catIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  stackAvatar: {
    width: 26, height: 26, borderRadius: 13, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyBox: { alignItems: 'center', paddingVertical: 48 },
  fab: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  fabBtn: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
