import { useCallback, useEffect, useState } from 'react';
import {
  ScrollView, View, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { getGroup, deleteGroup } from '@/services/group';
import { formatCurrency } from '@/constants/mock-data';
import { useAuth } from '@/context/auth-context';
import { useGroupExpenses } from '@/hooks/use-group-expenses';
import { useGroupBalances } from '@/hooks/use-group-balances';
import { deleteGroupExpense } from '@/services/group-expense';
import type { Group } from '@/interfaces/group';
import type { GroupExpense, DebtItem } from '@/interfaces/group-expense';

const AVATAR_COLORS = ['#C9F31D', '#7B61FF', '#FF4D4D', '#00C48C', '#FF8A00', '#4D9EFF'];
function avatarColor(i: number) { return AVATAR_COLORS[i % AVATAR_COLORS.length]; }

// ── Debt row ────────────────────────────────────────────────────────────────

function DebtRow({ debt, currentUserId, onSettle }: {
  debt: DebtItem;
  currentUserId: string;
  onSettle: (debt: DebtItem) => void;
}) {
  const { colors, spacing, radii } = useTheme();
  const iOwe = debt.fromUserId === currentUserId;
  const owesMe = debt.toUserId === currentUserId;
  const accentColor = iOwe ? colors.expense : colors.income;
  const label = iOwe
    ? `You owe ${debt.toUserName}`
    : owesMe
    ? `${debt.fromUserName} owes you`
    : `${debt.fromUserName} owes ${debt.toUserName}`;

  return (
    <TouchableOpacity
      onPress={() => (iOwe || owesMe) ? onSettle(debt) : undefined}
      activeOpacity={(iOwe || owesMe) ? 0.7 : 1}
      style={[styles.debtRow, { backgroundColor: colors.surface, borderRadius: radii.lg, borderLeftWidth: 3, borderLeftColor: accentColor }]}
    >
      <View style={{ flex: 1 }}>
        <ThemedText variant="bodySm" semibold>{label}</ThemedText>
        {(iOwe || owesMe) && (
          <ThemedText variant="caption" color={colors.textTertiary} style={{ marginTop: 2 }}>Tap to settle up</ThemedText>
        )}
      </View>
      <ThemedText variant="bodyLg" semibold color={accentColor}>{formatCurrency(debt.amount)}</ThemedText>
      {(iOwe || owesMe) && <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} style={{ marginLeft: spacing.sm }} />}
    </TouchableOpacity>
  );
}

// ── Expense row ─────────────────────────────────────────────────────────────

function ExpenseRow({ expense, currentUserId, groupId, onDeleted }: {
  expense: GroupExpense;
  currentUserId: string;
  groupId: string;
  onDeleted: () => void;
}) {
  const { colors } = useTheme();
  const myShare = expense.splits.find(s => s.userId === currentUserId);
  const iAmPayer = expense.paidBy === currentUserId;

  function handleLongPress() {
    if (!iAmPayer) return;
    Alert.alert(
      'Delete Expense',
      `Delete "${expense.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            try {
              await deleteGroupExpense(groupId, expense.id);
              onDeleted();
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Failed to delete.');
            }
          },
        },
      ],
    );
  }

  return (
    <TouchableOpacity onLongPress={iAmPayer ? handleLongPress : undefined} activeOpacity={0.8}>
      <View style={[styles.expenseRow, { borderBottomColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <ThemedText variant="bodySm" semibold numberOfLines={1}>{expense.title}</ThemedText>
          <ThemedText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
            Paid by {iAmPayer ? 'You' : expense.paidByName} · {expense.splitType}
          </ThemedText>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <ThemedText variant="bodySm" semibold>{formatCurrency(expense.amount)}</ThemedText>
          {myShare && (
            <ThemedText variant="caption" color={iAmPayer ? colors.income : colors.expense} style={{ marginTop: 2 }}>
              {iAmPayer ? `you paid` : `your share: ${formatCurrency(myShare.amount)}`}
            </ThemedText>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Main screen ─────────────────────────────────────────────────────────────

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radii } = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  const [group, setGroup]       = useState<Group | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const { expenses, refetch: refetchExpenses } = useGroupExpenses(id ?? '');
  const { balance, refetch: refetchBalances }  = useGroupBalances(id ?? '');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setGroup(await getGroup(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load group');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useFocusEffect(useCallback(() => {
    load();
    refetchExpenses();
    refetchBalances();
  }, [load, refetchExpenses, refetchBalances]));

  async function handleDelete() {
    if (!group) return;
    Alert.alert(
      'Delete Group',
      `Delete "${group.name}"? All expenses and settlements will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            try { await deleteGroup(group.id); router.back(); }
            catch (e) { Alert.alert('Error', e instanceof Error ? e.message : 'Failed to delete.'); }
          },
        },
      ],
    );
  }

  function handleSettle(debt: DebtItem) {
    if (!group || !user) return;
    router.push({
      pathname: '/group/settle',
      params: {
        groupId: group.id,
        fromUserId:   debt.fromUserId,
        fromUserName: debt.fromUserName,
        toUserId:     debt.toUserId,
        toUserName:   debt.toUserName,
        amount:       String(debt.amount),
      },
    } as any);
  }

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }} edges={['top']}>
        <ActivityIndicator color={colors.accent} size="large" />
      </SafeAreaView>
    );
  }

  if (error || !group) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }} edges={['top']}>
        <ThemedText variant="body" color={colors.expense}>{error ?? 'Group not found.'}</ThemedText>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <ThemedText variant="label" color={colors.accent}>Go back</ThemedText>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const yourBalance = balance?.yourBalance ?? 0;
  const totalExpenses = balance?.totalExpenses ?? 0;
  const debts = balance?.debts ?? [];
  const owed    = yourBalance > 0;
  const settled = yourBalance === 0;
  const isCreator = group.createdBy === user?.id;

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
          <ThemedText variant="caption" color={colors.textSecondary}>{group.memberCount} member{group.memberCount !== 1 ? 's' : ''}</ThemedText>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {isCreator && (
            <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={[styles.headerBtn, { backgroundColor: colors.expenseMuted, borderRadius: radii.full }]}>
              <Ionicons name="trash-outline" size={18} color={colors.expense} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/group/invite', params: { groupId: group.id, groupName: group.name } } as any)}
            style={[styles.headerBtn, { backgroundColor: colors.secondary, borderRadius: radii.full }]}
          >
            <Ionicons name="person-add-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Hero balance */}
        <LinearGradient colors={['#1A1A1A', '#141414']} style={[styles.hero, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
          <View style={{ alignItems: 'center' }}>
            <ThemedText variant="caption" color={colors.textSecondary}>YOUR BALANCE</ThemedText>
            {settled ? (
              <ThemedText variant="h2" color={colors.income} style={{ marginTop: 4 }}>All settled up ✓</ThemedText>
            ) : (
              <>
                <ThemedText variant="display" color={owed ? colors.income : colors.expense} style={{ marginTop: 4, letterSpacing: -2 }}>
                  {formatCurrency(Math.abs(yourBalance))}
                </ThemedText>
                <ThemedText variant="bodySm" color={colors.textSecondary} style={{ marginTop: 4 }}>
                  {owed ? 'the group owes you' : 'you owe the group'}
                </ThemedText>
              </>
            )}
          </View>
          <ThemedText variant="caption" color={colors.textTertiary} style={{ marginTop: spacing.md }}>
            Total group spend: {formatCurrency(totalExpenses)}
          </ThemedText>
        </LinearGradient>

        <View style={{ gap: spacing.xl, paddingTop: spacing.xl, paddingHorizontal: spacing.xl }}>

          {/* Balances (who owes whom) */}
          {debts.length > 0 && (
            <View>
              <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.md }}>BALANCES</ThemedText>
              <View style={{ gap: spacing.sm }}>
                {debts.map((debt, idx) => (
                  <DebtRow
                    key={idx}
                    debt={debt}
                    currentUserId={user?.id ?? ''}
                    onSettle={handleSettle}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Members */}
          <View>
            <View style={styles.sectionHeader}>
              <ThemedText variant="label" color={colors.textSecondary}>MEMBERS</ThemedText>
              <TouchableOpacity onPress={() => router.push({ pathname: '/group/invite', params: { groupId: group.id, groupName: group.name } } as any)}>
                <ThemedText variant="caption" color={colors.secondary}>+ Invite</ThemedText>
              </TouchableOpacity>
            </View>
            <Card padded={false}>
              {group.members.map((member, idx) => (
                <View
                  key={member.id}
                  style={[styles.memberRow, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md }, idx < group.members.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
                >
                  <View style={[styles.avatar, { backgroundColor: avatarColor(idx) + '22' }]}>
                    <ThemedText variant="caption" color={avatarColor(idx)} bold>{member.initials}</ThemedText>
                  </View>
                  <ThemedText variant="bodySm" semibold style={{ flex: 1, marginLeft: spacing.md }}>
                    {member.id === user?.id ? 'You' : member.name}
                  </ThemedText>
                </View>
              ))}
            </Card>
          </View>

          {/* Expenses */}
          <View>
            <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.md }}>EXPENSES</ThemedText>
            {expenses.length === 0 ? (
              <View style={styles.emptyBox}>
                <ThemedText style={{ fontSize: 40 }}>🧾</ThemedText>
                <ThemedText variant="h4" style={{ marginTop: 12 }}>No expenses yet</ThemedText>
                <ThemedText variant="body" color={colors.textSecondary} style={{ marginTop: 6, textAlign: 'center' }}>
                  Tap + to add the first expense for this group
                </ThemedText>
              </View>
            ) : (
              <Card padded={false}>
                {expenses.map((exp) => (
                  <ExpenseRow
                    key={exp.id}
                    expense={exp}
                    currentUserId={user?.id ?? ''}
                    groupId={group.id}
                    onDeleted={() => { refetchExpenses(); refetchBalances(); load(); }}
                  />
                ))}
              </Card>
            )}
          </View>

        </View>
      </ScrollView>

      {/* FAB */}
      <View style={[styles.fab, { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl }]}>
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/group/add-expense', params: { groupId: group.id } } as any)}
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
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  headerBtn:     { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  hero:          { paddingHorizontal: 24, paddingVertical: 28, alignItems: 'center', gap: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  memberRow:     { flexDirection: 'row', alignItems: 'center' },
  avatar:        { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  debtRow:       { flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 0 },
  expenseRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  emptyBox:      { alignItems: 'center', paddingVertical: 48 },
  fab:           { position: 'absolute', bottom: 0, left: 0, right: 0 },
  fabBtn:        { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
