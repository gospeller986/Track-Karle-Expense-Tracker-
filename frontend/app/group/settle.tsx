import { useState } from 'react';
import {
  View, TouchableOpacity, StyleSheet, StatusBar,
  KeyboardAvoidingView, Platform, Alert, TextInput, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { recordSettlement } from '@/services/group-expense';
import { formatCurrency } from '@/constants/mock-data';
import { useAuth } from '@/context/auth-context';

export default function SettleScreen() {
  const router = useRouter();
  const { colors, spacing, radii } = useTheme();
  const { user } = useAuth();

  const {
    groupId,
    fromUserId,
    fromUserName,
    toUserId,
    toUserName,
    amount: amountParam,
  } = useLocalSearchParams<{
    groupId: string;
    fromUserId: string;
    fromUserName: string;
    toUserId: string;
    toUserName: string;
    amount: string;
  }>();

  const suggestedAmount = parseFloat(amountParam ?? '0');
  const [amount, setAmount] = useState(suggestedAmount.toFixed(2));
  const [note, setNote]     = useState('');
  const [saving, setSaving] = useState(false);

  // Who is doing what from current user's perspective
  const iAmPayer = fromUserId === user?.id;
  const payerLabel = iAmPayer ? 'You' : fromUserName;
  const payeeLabel = toUserId === user?.id ? 'You' : toUserName;

  async function handleSettle() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount.');
      return;
    }
    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      // The current user must be the payer (fromUserId)
      await recordSettlement(groupId, {
        payeeId: toUserId,
        amount: amt,
        date: today,
        note: note.trim() || undefined,
      });
      router.back();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to record settlement.');
    } finally {
      setSaving(false);
    }
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
          <ThemedText variant="h4">Settle Up</ThemedText>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: spacing.xl, gap: spacing['2xl'] }}>

          {/* Direction card */}
          <Card>
            <View style={styles.directionRow}>
              {/* Payer */}
              <View style={styles.personBox}>
                <View style={[styles.avatar, { backgroundColor: colors.expenseMuted }]}>
                  <ThemedText variant="bodyLg" bold color={colors.expense}>
                    {(iAmPayer ? 'You' : fromUserName).slice(0, 2).toUpperCase()}
                  </ThemedText>
                </View>
                <ThemedText variant="bodySm" semibold style={{ marginTop: spacing.sm }}>{payerLabel}</ThemedText>
                <ThemedText variant="caption" color={colors.textSecondary}>pays</ThemedText>
              </View>

              {/* Arrow */}
              <View style={{ alignItems: 'center' }}>
                <Ionicons name="arrow-forward" size={28} color={colors.accent} />
                <ThemedText variant="caption" color={colors.textTertiary} style={{ marginTop: 4 }}>
                  {formatCurrency(suggestedAmount)}
                </ThemedText>
              </View>

              {/* Payee */}
              <View style={styles.personBox}>
                <View style={[styles.avatar, { backgroundColor: colors.secondaryMuted }]}>
                  <ThemedText variant="bodyLg" bold color={colors.secondary}>
                    {payeeLabel.slice(0, 2).toUpperCase()}
                  </ThemedText>
                </View>
                <ThemedText variant="bodySm" semibold style={{ marginTop: spacing.sm }}>{payeeLabel}</ThemedText>
                <ThemedText variant="caption" color={colors.textSecondary}>receives</ThemedText>
              </View>
            </View>
          </Card>

          {/* Amount */}
          <View>
            <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.sm }}>AMOUNT</ThemedText>
            <View style={styles.amountRow}>
              <ThemedText variant="h2" color={colors.income}>₹</ThemedText>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
                autoFocus
                style={[styles.amountInput, { color: colors.income, fontSize: 48, fontWeight: '800' }]}
              />
            </View>
            <View style={[styles.amountUnderline, { backgroundColor: colors.income + '44' }]} />
            {suggestedAmount > 0 && (
              <TouchableOpacity onPress={() => setAmount(suggestedAmount.toFixed(2))} style={{ marginTop: spacing.sm }}>
                <ThemedText variant="caption" color={colors.secondary}>
                  Use suggested: {formatCurrency(suggestedAmount)}
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>

          {/* Note */}
          <View>
            <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.sm }}>
              NOTE <ThemedText variant="label" color={colors.textTertiary}>(optional)</ThemedText>
            </ThemedText>
            <Card>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="e.g. Paid via UPI"
                placeholderTextColor={colors.textTertiary}
                style={[styles.noteInput, { color: colors.textPrimary }]}
              />
            </Card>
          </View>

          {!iAmPayer && (
            <ThemedText variant="caption" color={colors.textSecondary} style={{ textAlign: 'center' }}>
              You can only record settlements where you are the one paying.
            </ThemedText>
          )}

          <Button
            label={saving ? 'Recording…' : 'Record Settlement'}
            variant="primary"
            size="lg"
            fullWidth
            disabled={!iAmPayer || saving || !(parseFloat(amount) > 0)}
            onPress={handleSettle}
          />

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  directionRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  personBox:     { alignItems: 'center', flex: 1 },
  avatar:        { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  amountRow:     { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  amountInput:   { flex: 1, paddingBottom: 4, letterSpacing: -2 },
  amountUnderline:{ height: 2, borderRadius: 2, marginTop: 4 },
  noteInput:     { fontSize: 15, paddingVertical: 4 },
});
