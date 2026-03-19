import { useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, StatusBar, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CATEGORIES } from '@/constants/mock-data';

type ExpenseType = 'expense' | 'income';

export default function AddExpenseScreen() {
  const { colors, spacing, radii } = useTheme();
  const router = useRouter();

  const [type, setType]             = useState<ExpenseType>('expense');
  const [amount, setAmount]         = useState('');
  const [title, setTitle]           = useState('');
  const [selectedCat, setSelectedCat] = useState(CATEGORIES[0].id);
  const [note, setNote]             = useState('');

  const amountColor = type === 'expense' ? colors.expense : colors.income;

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
                  onPress={() => setType(t)}
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

            {/* Big amount input */}
            <View style={[styles.amountSection, { paddingHorizontal: spacing.xl }]}>
              <ThemedText variant="h4" color={colors.textSecondary} style={{ marginBottom: spacing.sm }}>
                AMOUNT
              </ThemedText>
              <View style={[styles.amountRow]}>
                <ThemedText variant="h2" color={amountColor}>₹</ThemedText>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  style={[
                    styles.amountInput,
                    { color: amountColor, fontSize: 56, fontWeight: '800' },
                  ]}
                  autoFocus
                />
              </View>
              {/* underline */}
              <View style={[styles.amountUnderline, { backgroundColor: amountColor + '44' }]} />
            </View>

            {/* Title input */}
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
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 10 }}>
                {CATEGORIES.map(cat => {
                  const isSelected = selectedCat === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setSelectedCat(cat.id)}
                      style={[
                        styles.catChip,
                        {
                          backgroundColor: isSelected ? cat.color + '22' : colors.surface,
                          borderColor: isSelected ? cat.color : colors.border,
                          borderRadius: radii.xl,
                          borderWidth: 1,
                        },
                      ]}
                    >
                      <ThemedText style={{ fontSize: 22 }}>{cat.icon}</ThemedText>
                      <ThemedText variant="caption" color={isSelected ? cat.color : colors.textSecondary} style={{ marginTop: 4 }}>
                        {cat.name.split(' ')[0]}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
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
            <View style={{ paddingHorizontal: spacing.xl }}>
              <Button
                label="Save Transaction"
                variant="primary"
                size="lg"
                fullWidth
                onPress={() => router.back()}
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
  typeToggle: { flexDirection: 'row', gap: 10 },
  typeBtn: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  amountSection: {},
  amountRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  amountInput: { flex: 1, paddingBottom: 4, letterSpacing: -2 },
  amountUnderline: { height: 2, borderRadius: 2, marginTop: 4 },
  titleInput: { paddingVertical: 4 },
  catChip: { alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, minWidth: 80 },
  noteInput: { fontSize: 15, paddingVertical: 4, textAlignVertical: 'top', minHeight: 72 },
});
