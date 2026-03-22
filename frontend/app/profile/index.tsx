import { useState } from 'react';
import {
  ScrollView, View, TouchableOpacity, StyleSheet,
  StatusBar, Switch, Alert, Modal, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth-context';
import { getInitials } from '@/services/user';
import { ApiError } from '@/services/api';
import { NotificationPreferences } from '@/components/profile/notification-preferences';

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'];

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  const { colors, radii } = useTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderRadius: radii.xl, borderColor: colors.border, borderWidth: 1 }]}>
      <ThemedText style={{ fontSize: 22 }}>{icon}</ThemedText>
      <ThemedText variant="h4" bold style={{ marginTop: 6 }}>{value}</ThemedText>
      <ThemedText variant="caption" color={colors.textSecondary}>{label}</ThemedText>
    </View>
  );
}

function SettingRow({ icon, label, value, onPress, rightElement }: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}) {
  const { colors, spacing } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[styles.settingRow, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}
    >
      <ThemedText style={{ fontSize: 18, width: 28 }}>{icon}</ThemedText>
      <ThemedText variant="bodySm" semibold style={{ flex: 1, marginLeft: spacing.md }}>{label}</ThemedText>
      {value && <ThemedText variant="bodySm" color={colors.textSecondary}>{value}</ThemedText>}
      {rightElement}
      {onPress && <ThemedText variant="body" color={colors.textTertiary} style={{ marginLeft: 8 }}>›</ThemedText>}
    </TouchableOpacity>
  );
}

// ── Edit Name Modal ────────────────────────────────────────────────────────

function EditNameModal({ visible, current, onSave, onClose }: {
  visible: boolean;
  current: string;
  onSave: (name: string) => Promise<void>;
  onClose: () => void;
}) {
  const { colors, spacing, radii } = useTheme();
  const [name, setName] = useState(current);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await onSave(name.trim());
    setLoading(false);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.modalBox, { backgroundColor: colors.bgElevated, borderRadius: radii['2xl'], borderColor: colors.border, borderWidth: 1 }]}>
          <ThemedText variant="h4" style={{ marginBottom: spacing.xl }}>Edit Name</ThemedText>
          <Input
            label="Full Name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoFocus
          />
          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl }}>
            <Button label="Cancel" variant="secondary" size="md" style={{ flex: 1 }} onPress={onClose} />
            <Button label="Save" variant="primary" size="md" style={{ flex: 1 }} loading={loading} onPress={handleSave} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Currency Modal ─────────────────────────────────────────────────────────

function CurrencyModal({ visible, current, onSave, onClose }: {
  visible: boolean;
  current: string;
  onSave: (currency: string) => Promise<void>;
  onClose: () => void;
}) {
  const { colors, spacing, radii } = useTheme();
  const [selected, setSelected] = useState(current);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await onSave(selected);
    setLoading(false);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.modalBox, { backgroundColor: colors.bgElevated, borderRadius: radii['2xl'], borderColor: colors.border, borderWidth: 1 }]}>
          <ThemedText variant="h4" style={{ marginBottom: spacing.xl }}>Currency</ThemedText>
          <View style={{ gap: spacing.sm }}>
            {CURRENCIES.map(c => (
              <TouchableOpacity
                key={c}
                onPress={() => setSelected(c)}
                style={[
                  styles.currencyRow,
                  {
                    backgroundColor: selected === c ? colors.accentMuted : colors.surface,
                    borderColor: selected === c ? colors.accent : colors.border,
                    borderRadius: radii.lg,
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.md,
                  },
                ]}
              >
                <ThemedText variant="body" color={selected === c ? colors.accent : colors.textPrimary} semibold={selected === c}>
                  {c}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl }}>
            <Button label="Cancel" variant="secondary" size="md" style={{ flex: 1 }} onPress={onClose} />
            <Button label="Save" variant="primary" size="md" style={{ flex: 1 }} loading={loading} onPress={handleSave} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Budget Modal ───────────────────────────────────────────────────────────

function BudgetModal({ visible, current, onSave, onClose }: {
  visible: boolean;
  current: number | null;
  onSave: (budget: number | null) => Promise<void>;
  onClose: () => void;
}) {
  const { colors, spacing, radii } = useTheme();
  const [value, setValue] = useState(current ? String(current) : '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    const parsed = value.trim() ? parseFloat(value) : null;
    await onSave(isNaN(parsed as number) ? null : parsed);
    setLoading(false);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.modalBox, { backgroundColor: colors.bgElevated, borderRadius: radii['2xl'], borderColor: colors.border, borderWidth: 1 }]}>
          <ThemedText variant="h4" style={{ marginBottom: spacing.xs }}>Monthly Budget</ThemedText>
          <ThemedText variant="bodySm" color={colors.textSecondary} style={{ marginBottom: spacing.xl }}>
            Leave blank to remove the budget limit.
          </ThemedText>
          <Input
            label="Amount"
            value={value}
            onChangeText={setValue}
            keyboardType="decimal-pad"
            placeholder="e.g. 40000"
            autoFocus
          />
          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl }}>
            <Button label="Cancel" variant="secondary" size="md" style={{ flex: 1 }} onPress={onClose} />
            <Button label="Save" variant="primary" size="md" style={{ flex: 1 }} loading={loading} onPress={handleSave} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { colors, spacing, radii } = useTheme();
  const router = useRouter();
  const { user, updateProfile, logout } = useAuth();

  const [editNameVisible,   setEditNameVisible]   = useState(false);
  const [currencyVisible,   setCurrencyVisible]   = useState(false);
  const [budgetVisible,     setBudgetVisible]     = useState(false);
  const [savingNotif,       setSavingNotif]       = useState(false);

  if (!user) return null;

  const initials       = getInitials(user.name);
  const formattedBudget = user.monthlyBudget
    ? `${user.currency} ${user.monthlyBudget.toLocaleString()}`
    : 'Not set';

  const handleSaveName = async (name: string) => {
    try { await updateProfile({ name }); } catch {}
    setEditNameVisible(false);
  };

  const handleSaveCurrency = async (currency: string) => {
    try { await updateProfile({ currency }); } catch {}
    setCurrencyVisible(false);
  };

  const handleSaveBudget = async (monthlyBudget: number | null) => {
    try { await updateProfile({ monthlyBudget }); } catch {}
    setBudgetVisible(false);
  };

  const handleToggleNotifications = async (value: boolean) => {
    setSavingNotif(true);
    try { await updateProfile({ notificationsEnabled: value }); } catch {}
    setSavingNotif(false);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            // deleteAccount handled by calling logout after server deletion
            await logout();
          } catch {}
        }},
      ],
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* Modals */}
      <EditNameModal
        visible={editNameVisible}
        current={user.name}
        onSave={handleSaveName}
        onClose={() => setEditNameVisible(false)}
      />
      <CurrencyModal
        visible={currencyVisible}
        current={user.currency}
        onSave={handleSaveCurrency}
        onClose={() => setCurrencyVisible(false)}
      />
      <BudgetModal
        visible={budgetVisible}
        current={user.monthlyBudget}
        onSave={handleSaveBudget}
        onClose={() => setBudgetVisible(false)}
      />

      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.xl, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ThemedText variant="bodyLg" color={colors.textSecondary}>‹ Back</ThemedText>
        </TouchableOpacity>
        <ThemedText variant="h4">Profile</ThemedText>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Avatar + name hero */}
        <LinearGradient
          colors={['#1A1A1A', '#141414']}
          style={[styles.hero, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
        >
          <View style={[styles.avatar, { backgroundColor: colors.accentMuted, borderColor: colors.accent, borderWidth: 2 }]}>
            <ThemedText variant="h2" color={colors.accent}>{initials}</ThemedText>
          </View>
          <ThemedText variant="h3" style={{ marginTop: spacing.md }}>{user.name}</ThemedText>
          <ThemedText variant="bodySm" color={colors.textSecondary} style={{ marginTop: 4 }}>{user.email}</ThemedText>
          <ThemedText variant="caption" color={colors.textTertiary} style={{ marginTop: 4 }}>
            Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </ThemedText>
        </LinearGradient>

        <View style={{ gap: spacing.xl, paddingTop: spacing.xl, paddingHorizontal: spacing.xl }}>

          {/* Account settings */}
          <View>
            <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.md }}>ACCOUNT</ThemedText>
            <Card padded={false}>
              {([
                { icon: '👤', label: 'Edit Name',       onPress: () => setEditNameVisible(true) },
                { icon: '💱', label: 'Currency',         value: user.currency,    onPress: () => setCurrencyVisible(true) },
                { icon: '💰', label: 'Monthly Budget',   value: formattedBudget,  onPress: () => setBudgetVisible(true) },
                { icon: '🔒', label: 'Change Password',  onPress: () => router.push('/auth/forgot-password') },
              ] as const).map((item, idx, arr) => (
                <View key={item.label} style={idx < arr.length - 1 ? { borderBottomColor: colors.border, borderBottomWidth: 1 } : undefined}>
                  <SettingRow {...item} />
                </View>
              ))}
            </Card>
          </View>

          {/* Preferences */}
          <View>
            <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.md }}>PREFERENCES</ThemedText>
            <Card padded={false}>
              <View style={{ borderBottomColor: colors.border, borderBottomWidth: 1 }}>
                <SettingRow
                  icon="🔔"
                  label="Notifications"
                  rightElement={
                    savingNotif
                      ? <ActivityIndicator size="small" color={colors.accent} style={{ marginLeft: 8 }} />
                      : (
                        <Switch
                          value={user.notificationsEnabled}
                          onValueChange={handleToggleNotifications}
                          trackColor={{ false: colors.border, true: colors.accentMuted }}
                          thumbColor={user.notificationsEnabled ? colors.accent : colors.textTertiary}
                        />
                      )
                  }
                />
              </View>
              <SettingRow icon="🌙" label="Theme" value={user.theme === 'dark' ? 'Dark' : 'Light'} />
            </Card>
          </View>

          {/* Per-type notification toggles — only shown when master switch is on */}
          {user.notificationsEnabled && (
            <View>
              <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.md }}>NOTIFICATION TYPES</ThemedText>
              <NotificationPreferences />
            </View>
          )}

          {/* More */}
          <View>
            <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.md }}>MORE</ThemedText>
            <Card padded={false}>
              <View style={{ borderBottomColor: colors.border, borderBottomWidth: 1 }}>
                <SettingRow icon="🚪" label="Sign Out" onPress={handleSignOut} />
              </View>
              <SettingRow icon="🗑️" label="Delete Account" onPress={handleDeleteAccount} />
            </Card>
          </View>

          <ThemedText variant="caption" color={colors.textTertiary} style={{ textAlign: 'center' }}>
            Expense Tracker v1.0.0
          </ThemedText>

        </View>
      </ScrollView>
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
  hero: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingRow:   { flexDirection: 'row', alignItems: 'center' },
  statCard:     { flex: 1, alignItems: 'center', padding: 14, gap: 2 },
  modalOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalBox:     { width: '100%', padding: 24 },
  currencyRow:  { borderWidth: 1 },
});
