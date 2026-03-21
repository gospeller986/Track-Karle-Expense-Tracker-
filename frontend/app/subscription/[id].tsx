import { useEffect, useState } from 'react';
import {
  View, ScrollView, TouchableOpacity, StyleSheet, StatusBar,
  Alert, ActivityIndicator, Platform, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getSubscription, updateSubscription, deleteSubscription } from '@/services/subscription';
import { formatCurrency } from '@/constants/mock-data';
import type { Subscription } from '@/interfaces/subscription';
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

function daysUntil(isoDate: string): number {
  const target = new Date(isoDate);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export default function SubscriptionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radii } = useTheme();
  const router = useRouter();

  const [sub, setSub]             = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // Edit state
  const [name, setName]           = useState('');
  const [color, setColor]         = useState('');
  const [amount, setAmount]       = useState('');
  const [cycle, setCycle]         = useState<BillingCycle>('monthly');
  const [category, setCategory]   = useState('Other');
  const [renewal, setRenewal]     = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const icon = CATEGORY_ICONS[category] ?? '📦';

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    getSubscription(id)
      .then(data => {
        setSub(data);
        setName(data.name);
        setColor(data.color);
        setAmount(String(data.amount));
        setCycle(data.cycle);
        setCategory(data.category ?? 'Other');
        setRenewal(isoToDate(data.nextRenewal));
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setIsLoading(false));
  }, [id]);

  function renewalISO(): string {
    return renewal.toISOString().split('T')[0];
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Required fields missing', 'Name is required.');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateSubscription(id!, {
        name:        name.trim(),
        icon,
        color,
        amount:      parseFloat(amount) || 0,
        cycle,
        nextRenewal: renewalISO(),
        category,
      });
      setSub(updated);
      setEditing(false);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to update.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    Alert.alert(
      'Delete Subscription',
      `Remove ${sub?.name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteSubscription(id!);
              router.back();
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Failed to delete.');
              setDeleting(false);
            }
          },
        },
      ],
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }} edges={['top']}>
        <ActivityIndicator color={colors.accent} size="large" />
      </SafeAreaView>
    );
  }

  if (error || !sub) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }} edges={['top']}>
        <ThemedText variant="body" color={colors.expense}>{error ?? 'Not found.'}</ThemedText>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <ThemedText variant="label" color={colors.accent}>Go back</ThemedText>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const days = daysUntil(sub.nextRenewal);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.xl, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ThemedText variant="bodyLg" color={colors.textSecondary}>‹ Back</ThemedText>
        </TouchableOpacity>
        <ThemedText variant="h4">{editing ? 'Edit' : 'Detail'}</ThemedText>
        <TouchableOpacity onPress={() => setEditing(e => !e)}>
          <ThemedText variant="bodyLg" color={colors.accent}>{editing ? 'Cancel' : 'Edit'}</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>

        {/* Hero */}
        <LinearGradient
          colors={['#1A1A1A', '#141414']}
          style={[styles.hero, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
        >
          <View style={[styles.iconBubble, { backgroundColor: sub.color + '22', borderRadius: radii['2xl'] }]}>
            <ThemedText style={{ fontSize: 40 }}>{sub.icon}</ThemedText>
          </View>
          <ThemedText variant="h3" style={{ marginTop: spacing.md }}>{sub.name}</ThemedText>
          <ThemedText variant="display" color={colors.accent} style={{ marginTop: spacing.sm, letterSpacing: -2 }}>
            {sub.amount === 0 ? 'Free' : formatCurrency(sub.amount)}
          </ThemedText>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <Badge label={sub.cycle.charAt(0).toUpperCase() + sub.cycle.slice(1)} variant="accent" size="sm" />
            {days <= 3  && <Badge label="Renewing soon!" variant="expense"  size="sm" />}
            {days > 3 && days <= 7 && <Badge label={`${days}d`} variant="warning" size="sm" />}
          </View>
        </LinearGradient>

        <View style={{ padding: spacing.xl, gap: spacing.md }}>

          {/* View mode */}
          {!editing && (
            <Card padded={false}>
              {[
                { label: 'Category',      value: sub.category,   icon: '📂' },
                { label: 'Next renewal',  value: sub.nextRenewal, icon: '📅' },
                { label: 'Renews in',     value: days > 0 ? `${days} days` : days === 0 ? 'Today' : 'Overdue', icon: '⏰' },
                { label: 'Billing cycle', value: sub.cycle.charAt(0).toUpperCase() + sub.cycle.slice(1), icon: '🔄' },
              ].map((row, idx, arr) => (
                <View
                  key={row.label}
                  style={[
                    styles.detailRow,
                    { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
                    idx < arr.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 },
                  ]}
                >
                  <ThemedText variant="bodySm" color={colors.textSecondary}>{row.label}</ThemedText>
                  <View style={styles.detailValue}>
                    <ThemedText style={{ fontSize: 16 }}>{row.icon}</ThemedText>
                    <ThemedText variant="bodySm" semibold style={{ marginLeft: 6 }}>{row.value}</ThemedText>
                  </View>
                </View>
              ))}
            </Card>
          )}

          {/* Edit mode */}
          {editing && (
            <View style={{ gap: spacing.md }}>

              {/* Name */}
              <Card>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Name"
                  placeholderTextColor={colors.textTertiary}
                  style={{ color: colors.textPrimary, fontSize: 16, paddingVertical: 4 }}
                />
              </Card>

              {/* Category */}
              <ThemedText variant="label" color={colors.textSecondary}>CATEGORY</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing.xl }}>
                <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: spacing.xl }}>
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setCategory(cat)}
                      style={[
                        styles.catChip,
                        { borderRadius: radii.full, borderWidth: 1 },
                        category === cat
                          ? { backgroundColor: colors.accentMuted, borderColor: colors.accent }
                          : { backgroundColor: colors.surface, borderColor: colors.border },
                      ]}
                    >
                      <ThemedText style={{ fontSize: 14, marginRight: 4 }}>{CATEGORY_ICONS[cat]}</ThemedText>
                      <ThemedText variant="caption" color={category === cat ? colors.accent : colors.textSecondary}>
                        {cat}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Icon preview */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ThemedText style={{ fontSize: 28 }}>{icon}</ThemedText>
                <ThemedText variant="bodySm" color={colors.textSecondary}>icon from category</ThemedText>
              </View>

              {/* Color */}
              <ThemedText variant="label" color={colors.textSecondary}>BRAND COLOR</ThemedText>
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

              {/* Amount */}
              <Card>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <ThemedText variant="h4" color={colors.accent}>₹</ThemedText>
                  <TextInput
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={colors.textTertiary}
                    style={{ flex: 1, color: colors.accent, fontSize: 24, fontWeight: '700', paddingVertical: 4 }}
                  />
                </View>
              </Card>

              {/* Cycle */}
              <ThemedText variant="label" color={colors.textSecondary}>BILLING CYCLE</ThemedText>
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
                    <ThemedText variant="label" color={cycle === c ? colors.accent : colors.textSecondary}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Renewal date */}
              <ThemedText variant="label" color={colors.textSecondary}>NEXT RENEWAL</ThemedText>
              <TouchableOpacity
                onPress={() => setShowPicker(true)}
                style={[
                  styles.datePill,
                  { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg, borderWidth: 1 },
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
                  style={[styles.doneBtn, { backgroundColor: colors.accentMuted, borderRadius: radii.md }]}
                >
                  <ThemedText variant="label" color={colors.accent}>Done</ThemedText>
                </TouchableOpacity>
              )}

              <Button
                label={saving ? 'Saving…' : 'Save Changes'}
                variant="primary"
                size="lg"
                fullWidth
                onPress={handleSave}
                disabled={saving}
              />
            </View>
          )}

          {/* Delete */}
          <TouchableOpacity
            onPress={handleDelete}
            disabled={deleting}
            style={[
              styles.deleteBtn,
              {
                backgroundColor: colors.expenseMuted,
                borderRadius: radii.lg,
                borderColor: colors.expense,
                borderWidth: 1,
                opacity: deleting ? 0.6 : 1,
              },
            ]}
          >
            <ThemedText variant="label" color={colors.expense}>
              {deleting ? 'Deleting…' : '🗑  Remove Subscription'}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  hero:        { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 24, gap: 10 },
  iconBubble:  { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  detailRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailValue: { flexDirection: 'row', alignItems: 'center' },
  colorRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorDot:    { width: 36, height: 36 },
  cycleRow:    { flexDirection: 'row', gap: 10 },
  cycleBtn:    { flex: 1, alignItems: 'center', paddingVertical: 12 },
  deleteBtn:   { alignItems: 'center', paddingVertical: 16, marginTop: 8 },
  catChip:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  datePill:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  doneBtn:     { alignItems: 'center', paddingVertical: 10 },
});
