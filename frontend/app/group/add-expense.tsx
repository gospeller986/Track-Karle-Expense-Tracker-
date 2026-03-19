import { useState, useCallback } from 'react';
import {
  View, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, StatusBar, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GROUPS, GROUP_MEMBERS, CATEGORIES, formatCurrency } from '@/constants/mock-data';
import type { SplitType } from '@/constants/mock-data';

// ─── Types ────────────────────────────────────────────────────

type MemberShare = {
  memberId: string;
  amount: string;      // raw input string for unequal
  percentage: string;  // raw input string for percentage
  included: boolean;   // used for equal split member selection
};

// ─── Helpers ──────────────────────────────────────────────────

const AVATAR_COLORS = ['#C9F31D', '#7B61FF', '#FF4D4D', '#00C48C', '#FF8A00', '#4D9EFF'];

function initShares(memberIds: string[]): MemberShare[] {
  return memberIds.map(id => ({
    memberId: id,
    amount: '',
    percentage: '',
    included: true,
  }));
}

function calcEqualShare(totalStr: string, shares: MemberShare[]): number {
  const total = parseFloat(totalStr) || 0;
  const includedCount = shares.filter(s => s.included).length;
  if (includedCount === 0) return 0;
  return total / includedCount;
}

function unequalTotal(shares: MemberShare[]): number {
  return shares.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
}

function percentageTotal(shares: MemberShare[]): number {
  return shares.reduce((sum, s) => sum + (parseFloat(s.percentage) || 0), 0);
}

// ─── Split Tab Button ─────────────────────────────────────────

function SplitTab({
  label, icon, active, onPress,
}: { label: string; icon: string; active: boolean; onPress: () => void }) {
  const { colors, radii } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.splitTab,
        {
          backgroundColor: active ? colors.secondary : colors.surface,
          borderColor: active ? colors.secondary : colors.border,
          borderRadius: radii.lg,
          borderWidth: 1,
        },
      ]}
    >
      <ThemedText style={{ fontSize: 16 }}>{icon}</ThemedText>
      <ThemedText variant="label" color={active ? '#fff' : colors.textSecondary} style={{ marginTop: 2 }}>
        {label}
      </ThemedText>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────

export default function AddGroupExpenseScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { colors, spacing, radii } = useTheme();
  const router = useRouter();

  const group = GROUPS.find(g => g.id === groupId) ?? GROUPS[0];

  // Form state
  const [amount, setAmount]       = useState('');
  const [title, setTitle]         = useState('');
  const [categoryId, setCatId]    = useState(CATEGORIES[0].id);
  const [paidBy, setPaidBy]       = useState('u1');
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [shares, setShares]       = useState<MemberShare[]>(initShares(group.members.map(m => m.id)));
  const [note, setNote]           = useState('');

  // Derived
  const parsedAmount   = parseFloat(amount) || 0;
  const equalShare     = calcEqualShare(amount, shares);
  const uneqTotal      = unequalTotal(shares);
  const pctTotal       = percentageTotal(shares);
  const uneqRemaining  = parsedAmount - uneqTotal;
  const pctRemaining   = 100 - pctTotal;

  const splitValid =
    splitType === 'equal'      ? shares.some(s => s.included) :
    splitType === 'unequal'    ? Math.abs(uneqRemaining) < 0.01 :
    /* percentage */             Math.abs(pctRemaining) < 0.01;

  const canSave = parsedAmount > 0 && title.trim().length > 0 && splitValid;

  // ── Toggle member inclusion (equal split) ──
  function toggleIncluded(memberId: string) {
    setShares(prev => prev.map(s =>
      s.memberId === memberId ? { ...s, included: !s.included } : s
    ));
  }

  // ── Update unequal amount ──
  function setMemberAmount(memberId: string, val: string) {
    setShares(prev => prev.map(s =>
      s.memberId === memberId ? { ...s, amount: val } : s
    ));
  }

  // ── Update percentage ──
  function setMemberPct(memberId: string, val: string) {
    setShares(prev => prev.map(s =>
      s.memberId === memberId ? { ...s, percentage: val } : s
    ));
  }

  // ── Reset shares when split type changes ──
  function changeSplitType(type: SplitType) {
    setSplitType(type);
    setShares(initShares(group.members.map(m => m.id)));
  }

  function handleSave() {
    Alert.alert(
      'Expense added!',
      `${title} (${formatCurrency(parsedAmount)}) split ${splitType}ly among ${
        splitType === 'equal'
          ? shares.filter(s => s.included).length
          : shares.length
      } members.`,
      [{ text: 'Done', onPress: () => router.back() }]
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: spacing.xl, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <ThemedText variant="h4">Add Group Expense</ThemedText>
            <ThemedText variant="caption" color={colors.textSecondary}>{group.icon} {group.name}</ThemedText>
          </View>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={{ gap: spacing['2xl'], paddingTop: spacing['2xl'] }}>

            {/* Amount */}
            <View style={{ paddingHorizontal: spacing.xl }}>
              <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.sm }}>AMOUNT</ThemedText>
              <View style={styles.amountRow}>
                <ThemedText variant="h2" color={colors.secondary}>₹</ThemedText>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  autoFocus
                  style={[styles.amountInput, { color: colors.secondary, fontSize: 52, fontWeight: '800' }]}
                />
              </View>
              <View style={[styles.amountUnderline, { backgroundColor: colors.secondary + '44' }]} />
            </View>

            {/* Title */}
            <View style={{ paddingHorizontal: spacing.xl }}>
              <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.sm }}>DESCRIPTION</ThemedText>
              <Card>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="What's this expense for?"
                  placeholderTextColor={colors.textTertiary}
                  style={[styles.titleInput, { color: colors.textPrimary, fontSize: 16 }]}
                />
              </Card>
            </View>

            {/* Category */}
            <View>
              <ThemedText variant="label" color={colors.textSecondary} style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.sm }}>
                CATEGORY
              </ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 8 }}>
                {CATEGORIES.map(cat => {
                  const sel = categoryId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setCatId(cat.id)}
                      style={[
                        styles.catChip,
                        {
                          backgroundColor: sel ? cat.color + '22' : colors.surface,
                          borderColor: sel ? cat.color : colors.border,
                          borderRadius: radii.xl,
                          borderWidth: 1,
                        },
                      ]}
                    >
                      <ThemedText style={{ fontSize: 20 }}>{cat.icon}</ThemedText>
                      <ThemedText variant="caption" color={sel ? cat.color : colors.textSecondary} style={{ marginTop: 3 }}>
                        {cat.name.split(' ')[0]}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Paid by */}
            <View style={{ paddingHorizontal: spacing.xl }}>
              <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.md }}>PAID BY</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {group.members.map((member, idx) => {
                  const sel = paidBy === member.id;
                  const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                  return (
                    <TouchableOpacity
                      key={member.id}
                      onPress={() => setPaidBy(member.id)}
                      style={[
                        styles.paidByChip,
                        {
                          backgroundColor: sel ? color + '22' : colors.surface,
                          borderColor: sel ? color : colors.border,
                          borderRadius: radii.xl,
                          borderWidth: 1.5,
                        },
                      ]}
                    >
                      <View style={[styles.paidByAvatar, { backgroundColor: color + '33' }]}>
                        <ThemedText variant="caption" color={color} bold>{member.initials}</ThemedText>
                      </View>
                      <ThemedText variant="bodySm" color={sel ? color : colors.textSecondary} semibold={sel} style={{ marginTop: 4 }}>
                        {member.id === 'u1' ? 'You' : member.name.split(' ')[0]}
                      </ThemedText>
                      {sel && <Ionicons name="checkmark-circle" size={14} color={color} style={{ marginTop: 2 }} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Split type selector */}
            <View style={{ paddingHorizontal: spacing.xl }}>
              <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.md }}>SPLIT TYPE</ThemedText>
              <View style={styles.splitTabs}>
                <SplitTab label="Equal"    icon="⚖️" active={splitType === 'equal'}      onPress={() => changeSplitType('equal')} />
                <SplitTab label="Unequal"  icon="✏️" active={splitType === 'unequal'}    onPress={() => changeSplitType('unequal')} />
                <SplitTab label="By %"     icon="%" active={splitType === 'percentage'}  onPress={() => changeSplitType('percentage')} />
              </View>
            </View>

            {/* ── Split detail ── */}
            <View style={{ paddingHorizontal: spacing.xl }}>

              {/* ── EQUAL ── */}
              {splitType === 'equal' && (
                <View>
                  <View style={[styles.sectionHeader, { marginBottom: spacing.md }]}>
                    <ThemedText variant="label" color={colors.textSecondary}>SELECT MEMBERS</ThemedText>
                    {parsedAmount > 0 && shares.some(s => s.included) && (
                      <Badge
                        label={`${formatCurrency(equalShare)} each`}
                        variant="secondary"
                      />
                    )}
                  </View>
                  <Card padded={false}>
                    {group.members.map((member, idx) => {
                      const share = shares.find(s => s.memberId === member.id)!;
                      const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                      const isLast = idx === group.members.length - 1;
                      return (
                        <TouchableOpacity
                          key={member.id}
                          onPress={() => toggleIncluded(member.id)}
                          activeOpacity={0.7}
                          style={[
                            styles.memberRow,
                            { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
                            !isLast && { borderBottomColor: colors.border, borderBottomWidth: 1 },
                            share.included && { backgroundColor: colors.secondaryMuted },
                          ]}
                        >
                          <View style={[styles.memberAvatar, { backgroundColor: color + '22' }]}>
                            <ThemedText variant="caption" color={color} bold>{member.initials}</ThemedText>
                          </View>
                          <ThemedText variant="bodySm" semibold style={{ flex: 1, marginLeft: spacing.md }}>
                            {member.id === 'u1' ? 'You' : member.name}
                          </ThemedText>
                          {share.included && parsedAmount > 0 && (
                            <ThemedText variant="bodySm" color={colors.secondary} semibold style={{ marginRight: spacing.md }}>
                              {formatCurrency(equalShare)}
                            </ThemedText>
                          )}
                          <View style={[
                            styles.checkbox,
                            {
                              backgroundColor: share.included ? colors.secondary : 'transparent',
                              borderColor: share.included ? colors.secondary : colors.border,
                              borderRadius: radii.full, borderWidth: 2,
                            },
                          ]}>
                            {share.included && <Ionicons name="checkmark" size={13} color="#fff" />}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </Card>
                </View>
              )}

              {/* ── UNEQUAL ── */}
              {splitType === 'unequal' && (
                <View>
                  <View style={[styles.sectionHeader, { marginBottom: spacing.md }]}>
                    <ThemedText variant="label" color={colors.textSecondary}>SET AMOUNTS</ThemedText>
                    <ThemedText
                      variant="label"
                      color={Math.abs(uneqRemaining) < 0.01 ? colors.income : colors.expense}
                    >
                      {Math.abs(uneqRemaining) < 0.01
                        ? '✓ balanced'
                        : uneqRemaining > 0
                        ? `${formatCurrency(uneqRemaining)} left`
                        : `${formatCurrency(Math.abs(uneqRemaining))} over`}
                    </ThemedText>
                  </View>

                  <Card padded={false}>
                    {group.members.map((member, idx) => {
                      const share = shares.find(s => s.memberId === member.id)!;
                      const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                      const isLast = idx === group.members.length - 1;
                      return (
                        <View
                          key={member.id}
                          style={[
                            styles.memberRow,
                            { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
                            !isLast && { borderBottomColor: colors.border, borderBottomWidth: 1 },
                          ]}
                        >
                          <View style={[styles.memberAvatar, { backgroundColor: color + '22' }]}>
                            <ThemedText variant="caption" color={color} bold>{member.initials}</ThemedText>
                          </View>
                          <ThemedText variant="bodySm" semibold style={{ flex: 1, marginLeft: spacing.md }}>
                            {member.id === 'u1' ? 'You' : member.name}
                          </ThemedText>
                          {/* Amount input */}
                          <View style={[
                            styles.amountChip,
                            { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderRadius: radii.lg, borderWidth: 1 },
                          ]}>
                            <ThemedText variant="bodySm" color={colors.textSecondary}>₹</ThemedText>
                            <TextInput
                              value={share.amount}
                              onChangeText={v => setMemberAmount(member.id, v)}
                              keyboardType="decimal-pad"
                              placeholder="0"
                              placeholderTextColor={colors.textTertiary}
                              style={[styles.amountChipInput, { color: colors.textPrimary }]}
                            />
                          </View>
                        </View>
                      );
                    })}
                  </Card>

                  {/* Progress bar */}
                  {parsedAmount > 0 && (
                    <View style={{ marginTop: spacing.md }}>
                      <View style={[styles.progressTrack, { backgroundColor: colors.surfaceElevated, borderRadius: 4 }]}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${Math.min((uneqTotal / parsedAmount) * 100, 100)}%` as any,
                              backgroundColor: Math.abs(uneqRemaining) < 0.01 ? colors.income : colors.secondary,
                              borderRadius: 4,
                            },
                          ]}
                        />
                      </View>
                      <ThemedText variant="caption" color={colors.textTertiary} style={{ marginTop: 4 }}>
                        {formatCurrency(uneqTotal)} allocated of {formatCurrency(parsedAmount)}
                      </ThemedText>
                    </View>
                  )}
                </View>
              )}

              {/* ── PERCENTAGE ── */}
              {splitType === 'percentage' && (
                <View>
                  <View style={[styles.sectionHeader, { marginBottom: spacing.md }]}>
                    <ThemedText variant="label" color={colors.textSecondary}>SET PERCENTAGES</ThemedText>
                    <ThemedText
                      variant="label"
                      color={Math.abs(pctRemaining) < 0.01 ? colors.income : colors.expense}
                    >
                      {Math.abs(pctRemaining) < 0.01
                        ? '✓ 100%'
                        : pctRemaining > 0
                        ? `${pctRemaining.toFixed(0)}% left`
                        : `${Math.abs(pctRemaining).toFixed(0)}% over`}
                    </ThemedText>
                  </View>

                  <Card padded={false}>
                    {group.members.map((member, idx) => {
                      const share = shares.find(s => s.memberId === member.id)!;
                      const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                      const isLast = idx === group.members.length - 1;
                      const derivedAmount = parsedAmount * ((parseFloat(share.percentage) || 0) / 100);
                      return (
                        <View
                          key={member.id}
                          style={[
                            styles.memberRow,
                            { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
                            !isLast && { borderBottomColor: colors.border, borderBottomWidth: 1 },
                          ]}
                        >
                          <View style={[styles.memberAvatar, { backgroundColor: color + '22' }]}>
                            <ThemedText variant="caption" color={color} bold>{member.initials}</ThemedText>
                          </View>
                          <View style={{ flex: 1, marginLeft: spacing.md }}>
                            <ThemedText variant="bodySm" semibold>
                              {member.id === 'u1' ? 'You' : member.name}
                            </ThemedText>
                            {parsedAmount > 0 && parseFloat(share.percentage) > 0 && (
                              <ThemedText variant="caption" color={colors.textSecondary}>
                                = {formatCurrency(derivedAmount)}
                              </ThemedText>
                            )}
                          </View>
                          {/* Percentage input */}
                          <View style={[
                            styles.amountChip,
                            { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderRadius: radii.lg, borderWidth: 1 },
                          ]}>
                            <TextInput
                              value={share.percentage}
                              onChangeText={v => setMemberPct(member.id, v)}
                              keyboardType="decimal-pad"
                              placeholder="0"
                              placeholderTextColor={colors.textTertiary}
                              style={[styles.amountChipInput, { color: colors.textPrimary }]}
                            />
                            <ThemedText variant="bodySm" color={colors.textSecondary}>%</ThemedText>
                          </View>
                        </View>
                      );
                    })}
                  </Card>

                  {/* Donut-style percentage bar */}
                  {pctTotal > 0 && (
                    <View style={{ marginTop: spacing.md }}>
                      <View style={[styles.progressTrack, { backgroundColor: colors.surfaceElevated, borderRadius: 4 }]}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${Math.min(pctTotal, 100)}%` as any,
                              backgroundColor: Math.abs(pctRemaining) < 0.01 ? colors.income : colors.secondary,
                              borderRadius: 4,
                            },
                          ]}
                        />
                      </View>
                      <ThemedText variant="caption" color={colors.textTertiary} style={{ marginTop: 4 }}>
                        {pctTotal.toFixed(0)}% allocated of 100%
                      </ThemedText>
                    </View>
                  )}
                </View>
              )}

            </View>

            {/* Note */}
            <View style={{ paddingHorizontal: spacing.xl }}>
              <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.sm }}>
                NOTE <ThemedText variant="label" color={colors.textTertiary}>(optional)</ThemedText>
              </ThemedText>
              <Card>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="Add a note..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={2}
                  style={[styles.noteInput, { color: colors.textPrimary }]}
                />
              </Card>
            </View>

            {/* Validation hint */}
            {!splitValid && parsedAmount > 0 && (
              <View style={{ paddingHorizontal: spacing.xl }}>
                <ThemedText variant="caption" color={colors.expense} style={{ textAlign: 'center' }}>
                  {splitType === 'equal'
                    ? 'Select at least one member to split with'
                    : splitType === 'unequal'
                    ? `Amounts must add up to ${formatCurrency(parsedAmount)} — ${formatCurrency(Math.abs(uneqRemaining))} ${uneqRemaining > 0 ? 'remaining' : 'over'}`
                    : `Percentages must add up to 100% — ${Math.abs(pctRemaining).toFixed(0)}% ${pctRemaining > 0 ? 'remaining' : 'over'}`}
                </ThemedText>
              </View>
            )}

            {/* Save */}
            <View style={{ paddingHorizontal: spacing.xl }}>
              <Button
                label="Add Expense"
                variant="primary"
                size="lg"
                fullWidth
                disabled={!canSave}
                onPress={handleSave}
              />
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  amountRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  amountInput: { flex: 1, paddingBottom: 4, letterSpacing: -2 },
  amountUnderline: { height: 2, borderRadius: 2, marginTop: 4 },
  titleInput: { paddingVertical: 4 },
  catChip: { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, minWidth: 72 },
  paidByChip: { alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, minWidth: 72 },
  paidByAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  splitTabs: { flexDirection: 'row', gap: 10 },
  splitTab: { flex: 1, alignItems: 'center', paddingVertical: 12, gap: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  memberRow: { flexDirection: 'row', alignItems: 'center' },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  checkbox: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  amountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 80,
  },
  amountChipInput: { fontSize: 15, minWidth: 48, textAlign: 'right' },
  progressTrack: { height: 6 },
  progressFill: { height: 6 },
  noteInput: { fontSize: 15, paddingVertical: 4, textAlignVertical: 'top', minHeight: 56 },
});
