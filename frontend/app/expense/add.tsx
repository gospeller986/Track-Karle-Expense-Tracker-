import { useRef, useState, useMemo } from 'react';
import {
  View, ScrollView, TouchableOpacity, StyleSheet, StatusBar,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCategories } from '@/hooks/use-categories';
import { useSound } from '@/hooks/use-sound';
import { createExpense } from '@/services/expense';
import { expenseRefreshBus } from '@/utils/refresh-bus';
import type { ExpenseType } from '@/types/expense';

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ─── Animated category chip ────────────────────────────────────

interface CatChipItem {
  id: string;
  name: string;
  icon: string;
  color: string;
}

function CatChip({
  cat, isSelected, onPress, colors, radii,
}: {
  cat: CatChipItem;
  isSelected: boolean;
  onPress: (id: string) => void;
  colors: ReturnType<typeof useTheme>['colors'];
  radii: ReturnType<typeof useTheme>['radii'];
}) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePress() {
    scale.setValue(1);
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.2, useNativeDriver: true, speed: 60, bounciness: 10 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 4 }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(cat.id);
  }

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1}>
      <Animated.View
        style={[
          styles.catChip,
          {
            backgroundColor: isSelected ? cat.color + '22' : colors.surface,
            borderColor: isSelected ? cat.color : colors.border,
            borderRadius: radii.xl,
            borderWidth: 1,
            transform: [{ scale }],
          },
        ]}
      >
        <ThemedText style={{ fontSize: 22 }}>{cat.icon}</ThemedText>
        <ThemedText
          variant="caption"
          color={isSelected ? cat.color : colors.textSecondary}
          style={{ marginTop: 4 }}
        >
          {cat.name.split(' ')[0]}
        </ThemedText>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ───────────────────────────────────────────────

export default function AddExpenseScreen() {
  const { colors, spacing, radii } = useTheme();
  const router = useRouter();
  const { categories, isLoading: catsLoading } = useCategories();
  const { play } = useSound();

  const [type, setType]               = useState<ExpenseType>('expense');
  const [amount, setAmount]           = useState('');
  const [title, setTitle]             = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [note, setNote]               = useState('');
  const [saving, setSaving]           = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const amountScale = useRef(new Animated.Value(1)).current;
  const btnShakeX   = useRef(new Animated.Value(0)).current;
  const amountColor = type === 'expense' ? colors.expense : colors.income;

  const visibleCategories = useMemo(() => {
    const primary = categories.filter(c => c.categoryType === type);
    const shared  = categories.filter(c => c.categoryType === 'both');
    return [...primary, ...shared];
  }, [categories, type]);

  function handleTypeChange(t: ExpenseType) {
    setType(t);
    const primary = categories.filter(c => c.categoryType === t);
    const shared  = categories.filter(c => c.categoryType === 'both');
    const first   = [...primary, ...shared][0];
    if (first) setSelectedCat(first.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function handleAmountChange(text: string) {
    setAmount(text);
    if (text) {
      amountScale.setValue(1);
      Animated.spring(amountScale, {
        toValue: 1.04,
        useNativeDriver: true,
        speed: 80,
        bounciness: 8,
      }).start(() => {
        Animated.spring(amountScale, { toValue: 1, useNativeDriver: true, speed: 25 }).start();
      });
    }
  }

  function shakeError() {
    btnShakeX.setValue(0);
    Animated.sequence([
      Animated.timing(btnShakeX, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(btnShakeX, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(btnShakeX, { toValue: 7, duration: 45, useNativeDriver: true }),
      Animated.timing(btnShakeX, { toValue: -7, duration: 45, useNativeDriver: true }),
      Animated.timing(btnShakeX, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    play('error');
  }

  async function handleSave() {
    if (!amount || parseFloat(amount) <= 0) {
      shakeError();
      Alert.alert('Invalid amount', 'Please enter an amount greater than 0.');
      return;
    }
    if (!title.trim()) {
      shakeError();
      Alert.alert('Title required', 'Please enter a title for this transaction.');
      return;
    }
    if (!selectedCat) {
      shakeError();
      Alert.alert('Category required', 'Please select a category.');
      return;
    }

    setSaving(true);
    try {
      await createExpense({
        title:      title.trim(),
        amount:     parseFloat(amount),
        type,
        categoryId: selectedCat,
        date:       todayISO(),
        note:       note.trim() || undefined,
      });
      expenseRefreshBus.emit();
      setSaveSuccess(true);
      play(type === 'income' ? 'income' : 'expense');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await new Promise(r => setTimeout(r, 650));
      router.back();
    } catch (e) {
      shakeError();
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save. Please try again.');
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
          <TouchableOpacity onPress={() => router.back()}>
            <ThemedText variant="bodyLg" color={colors.textSecondary}>✕</ThemedText>
          </TouchableOpacity>
          <ThemedText variant="h4">Add Transaction</ThemedText>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={{ gap: spacing['2xl'], paddingTop: spacing['2xl'] }}>

            {/* Type toggle */}
            <View style={[styles.typeToggle, { paddingHorizontal: spacing.xl }]}>
              {(['expense', 'income'] as ExpenseType[]).map(t => (
                <TouchableOpacity
                  key={t}
                  onPress={() => handleTypeChange(t)}
                  style={[
                    styles.typeBtn,
                    { borderRadius: radii.lg, borderWidth: 1.5 },
                    type === t && t === 'expense' && { backgroundColor: colors.expenseMuted, borderColor: colors.expense },
                    type === t && t === 'income'  && { backgroundColor: colors.incomeMuted,  borderColor: colors.income  },
                    type !== t && { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  <ThemedText
                    variant="label"
                    color={
                      type !== t ? colors.textSecondary :
                      t === 'expense' ? colors.expense : colors.income
                    }
                  >
                    {t === 'expense' ? '▼ Expense' : '▲ Income'}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            {/* Amount input */}
            <View style={[styles.amountSection, { paddingHorizontal: spacing.xl }]}>
              <ThemedText variant="h4" color={colors.textSecondary} style={{ marginBottom: spacing.sm }}>
                AMOUNT
              </ThemedText>
              <Animated.View style={[styles.amountRow, { transform: [{ scale: amountScale }] }]}>
                <ThemedText variant="h2" color={amountColor}>₹</ThemedText>
                <TextInput
                  value={amount}
                  onChangeText={handleAmountChange}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  style={[styles.amountInput, { color: amountColor, fontSize: 56, fontWeight: '800' }]}
                  autoFocus
                />
              </Animated.View>
              <View style={[styles.amountUnderline, { backgroundColor: amountColor + '44' }]} />
            </View>

            {/* Title */}
            <View style={{ paddingHorizontal: spacing.xl }}>
              <Card>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="What's this for?"
                  placeholderTextColor={colors.textTertiary}
                  style={[styles.titleInput, { color: colors.textPrimary, fontSize: 17 }]}
                />
              </Card>
            </View>

            {/* Category picker */}
            <View>
              <ThemedText variant="label" color={colors.textSecondary} style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.md }}>
                CATEGORY
              </ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 10 }}
              >
                {catsLoading && (
                  <ActivityIndicator color={colors.accent} style={{ marginLeft: spacing.xl }} />
                )}
                {visibleCategories.map(cat => (
                  <CatChip
                    key={cat.id}
                    cat={cat}
                    isSelected={selectedCat === cat.id}
                    onPress={setSelectedCat}
                    colors={colors}
                    radii={radii}
                  />
                ))}
              </ScrollView>
            </View>

            {/* Note */}
            <View style={{ paddingHorizontal: spacing.xl }}>
              <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.sm }}>
                NOTE (optional)
              </ThemedText>
              <Card>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="Add a note..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={3}
                  style={[styles.noteInput, { color: colors.textPrimary }]}
                />
              </Card>
            </View>

            {/* Save button */}
            <Animated.View style={{ paddingHorizontal: spacing.xl, transform: [{ translateX: btnShakeX }] }}>
              <Button
                label={saveSuccess ? '✓ Saved!' : saving ? 'Saving…' : 'Save Transaction'}
                variant="primary"
                size="lg"
                fullWidth
                onPress={handleSave}
                disabled={saving || saveSuccess}
                style={saveSuccess ? { backgroundColor: colors.income } : undefined}
              />
            </Animated.View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  typeToggle:      { flexDirection: 'row', gap: 10 },
  typeBtn:         { flex: 1, alignItems: 'center', paddingVertical: 14 },
  amountSection:   {},
  amountRow:       { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  amountInput:     { flex: 1, paddingBottom: 4, letterSpacing: -2 },
  amountUnderline: { height: 2, borderRadius: 2, marginTop: 4 },
  titleInput:      { paddingVertical: 4 },
  catChip:         { alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, minWidth: 80 },
  noteInput:       { fontSize: 15, paddingVertical: 4, textAlignVertical: 'top', minHeight: 72 },
});
