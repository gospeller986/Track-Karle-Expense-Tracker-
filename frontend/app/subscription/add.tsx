import { useState } from 'react';
import {
  View, ScrollView, TouchableOpacity, StyleSheet, StatusBar,
  TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createSubscription } from '@/services/subscription';
import type { BillingCycle } from '@/types/subscription';

const PRESET_COLORS = [
  '#E50914', '#1DB954', '#FF0000', '#3478F6', '#10A37F',
  '#F24E1E', '#FFCC00', '#7B61FF', '#FF4D9E', '#00B4D8',
];

const CATEGORIES = ['Entertainment', 'Music', 'Productivity', 'Storage', 'Design', 'News', 'Health', 'Other'];

const CATEGORY_ICONS: Record<string, string> = {
  Entertainment: '🎬',
  Music:         '🎵',
  Productivity:  '💼',
  Storage:       '💾',
  Design:        '🎨',
  News:          '📰',
  Health:        '🏃',
  Other:         '📦',
};

export default function AddSubscriptionScreen() {
  const { colors, spacing, radii } = useTheme();
  const router = useRouter();

  const [name, setName]         = useState('');
  const [color, setColor]       = useState(PRESET_COLORS[0]);
  const [amount, setAmount]     = useState('');
  const [cycle, setCycle]       = useState<BillingCycle>('monthly');
  const [renewal, setRenewal]   = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d;
  });
  const [category, setCategory] = useState('Entertainment');
  const [saving, setSaving]     = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  function handleCategoryChange(cat: string) {
    setCategory(cat);
  }

  const icon = CATEGORY_ICONS[category] ?? '📦';

  function renewalISO(): string {
    return renewal.toISOString().split('T')[0];
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a subscription name.');
      return;
    }
    const parsedAmount = parseFloat(amount) || 0;

    setSaving(true);
    try {
      await createSubscription({
        name:        name.trim(),
        icon,
        color,
        amount:      parsedAmount,
        cycle,
        nextRenewal: renewalISO(),
        category,
      });
      router.back();
    } catch (e) {
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
          <ThemedText variant="h4">Add Subscription</ThemedText>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={{ gap: spacing['2xl'], paddingTop: spacing['2xl'] }}>

            {/* Name */}
            <View style={{ paddingHorizontal: spacing.xl }}>
              <Card>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Netflix, Spotify…"
                  placeholderTextColor={colors.textTertiary}
                  style={{ color: colors.textPrimary, fontSize: 16, paddingVertical: 4 }}
                />
              </Card>
            </View>

            {/* Category */}
            <View>
              <ThemedText variant="label" color={colors.textSecondary} style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.md }}>
                CATEGORY
              </ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 8 }}
              >
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => handleCategoryChange(cat)}
                    style={[
                      styles.catChip,
                      { borderRadius: radii.full, borderWidth: 1 },
                      category === cat
                        ? { backgroundColor: colors.accentMuted, borderColor: colors.accent }
                        : { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                  >
                    <ThemedText style={{ fontSize: 16, marginRight: 4 }}>{CATEGORY_ICONS[cat]}</ThemedText>
                    <ThemedText
                      variant="caption"
                      color={category === cat ? colors.accent : colors.textSecondary}
                    >
                      {cat}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Selected icon preview */}
              <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ThemedText style={{ fontSize: 28 }}>{icon}</ThemedText>
                <ThemedText variant="bodySm" color={colors.textSecondary}>icon auto-selected from category</ThemedText>
              </View>
            </View>

            {/* Color picker */}
            <View style={{ paddingHorizontal: spacing.xl }}>
              <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.md }}>
                BRAND COLOR
              </ThemedText>
              <View style={styles.colorRow}>
                {PRESET_COLORS.map(c => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setColor(c)}
                    style={[
                      styles.colorDot,
                      { backgroundColor: c, borderRadius: 20 },
                      color === c && { borderWidth: 3, borderColor: colors.textPrimary },
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Amount */}
            <View style={{ paddingHorizontal: spacing.xl }}>
              <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.sm }}>
                AMOUNT
              </ThemedText>
              <View style={styles.amountRow}>
                <ThemedText variant="h2" color={colors.accent}>₹</ThemedText>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  style={{ flex: 1, color: colors.accent, fontSize: 40, fontWeight: '800', paddingBottom: 4, letterSpacing: -1 }}
                />
              </View>
              <View style={{ height: 2, borderRadius: 2, backgroundColor: colors.accent + '44', marginTop: 4 }} />
            </View>

            {/* Billing cycle */}
            <View style={{ paddingHorizontal: spacing.xl }}>
              <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.md }}>
                BILLING CYCLE
              </ThemedText>
              <View style={styles.cycleRow}>
                {(['monthly', 'yearly', 'weekly'] as BillingCycle[]).map(c => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setCycle(c)}
                    style={[
                      styles.cycleBtn,
                      { borderRadius: radii.lg, borderWidth: 1.5 },
                      cycle === c
                        ? { backgroundColor: colors.accentMuted, borderColor: colors.accent }
                        : { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                  >
                    <ThemedText
                      variant="label"
                      color={cycle === c ? colors.accent : colors.textSecondary}
                    >
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Next renewal date */}
            <View style={{ paddingHorizontal: spacing.xl }}>
              <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.sm }}>
                NEXT RENEWAL
              </ThemedText>
              <TouchableOpacity
                onPress={() => setShowPicker(true)}
                style={[
                  styles.datePill,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: radii.lg,
                    borderWidth: 1,
                  },
                ]}
              >
                <ThemedText style={{ fontSize: 18 }}>📅</ThemedText>
                <ThemedText variant="bodyLg" semibold style={{ marginLeft: 8 }}>
                  {renewal.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </ThemedText>
              </TouchableOpacity>

              {showPicker && (
                <DateTimePicker
                  value={renewal}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  minimumDate={new Date()}
                  onChange={(_, date) => {
                    setShowPicker(Platform.OS === 'ios');
                    if (date) setRenewal(date);
                  }}
                  themeVariant="dark"
                />
              )}

              {Platform.OS === 'ios' && showPicker && (
                <TouchableOpacity
                  onPress={() => setShowPicker(false)}
                  style={[styles.doneBtn, { backgroundColor: colors.accentMuted, borderRadius: radii.md, marginTop: 8 }]}
                >
                  <ThemedText variant="label" color={colors.accent}>Done</ThemedText>
                </TouchableOpacity>
              )}
            </View>

            {/* Save */}
            <View style={{ paddingHorizontal: spacing.xl }}>
              <Button
                label={saving ? 'Saving…' : 'Add Subscription'}
                variant="primary"
                size="lg"
                fullWidth
                onPress={handleSave}
                disabled={saving}
              />
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  colorRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorDot:  { width: 36, height: 36 },
  amountRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  cycleRow:  { flexDirection: 'row', gap: 10 },
  cycleBtn:  { flex: 1, alignItems: 'center', paddingVertical: 12 },
  catChip:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8 },
  datePill:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  doneBtn:   { alignItems: 'center', paddingVertical: 10 },
});
