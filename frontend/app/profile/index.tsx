import { ScrollView, View, TouchableOpacity, StyleSheet, StatusBar, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  USER_PROFILE, EXPENSES, GROUPS, SUBSCRIPTIONS,
  formatCurrency,
} from '@/constants/mock-data';

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

export default function ProfileScreen() {
  const { colors, spacing, radii } = useTheme();
  const router = useRouter();
  const [notificationsOn, setNotificationsOn] = useState(true);

  const totalSpent    = EXPENSES.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const totalTracked  = EXPENSES.length;
  const monthlySubCost = SUBSCRIPTIONS.reduce((s, sub) => s + (sub.cycle === 'monthly' ? sub.amount : sub.amount / 12), 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <StatusBar barStyle="light-content" />

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
            <ThemedText variant="h2" color={colors.accent}>{USER_PROFILE.initials}</ThemedText>
          </View>
          <ThemedText variant="h3" style={{ marginTop: spacing.md }}>{USER_PROFILE.name}</ThemedText>
          <ThemedText variant="bodySm" color={colors.textSecondary} style={{ marginTop: 4 }}>{USER_PROFILE.email}</ThemedText>
          <Badge label="Pro Member" variant="accent" />
        </LinearGradient>

        <View style={{ gap: spacing.xl, paddingTop: spacing.xl, paddingHorizontal: spacing.xl }}>

          {/* Stats */}
          <View style={styles.statsRow}>
            <StatCard label="Total spent" value={formatCurrency(totalSpent)} icon="💸" />
            <StatCard label="Transactions" value={`${totalTracked}`} icon="📝" />
            <StatCard label="Sub / mo" value={formatCurrency(monthlySubCost)} icon="🔄" />
          </View>

          {/* Account settings */}
          <View>
            <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.md }}>ACCOUNT</ThemedText>
            <Card padded={false}>
              {[
                { icon: '👤', label: 'Edit Profile',        onPress: () => {} },
                { icon: '💱', label: 'Currency',            value: '₹ INR',    onPress: () => {} },
                { icon: '💰', label: 'Monthly Budget',      value: formatCurrency(USER_PROFILE.monthlyBudget), onPress: () => {} },
                { icon: '🔒', label: 'Change Password',     onPress: () => {} },
              ].map((item, idx, arr) => (
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
                    <Switch
                      value={notificationsOn}
                      onValueChange={setNotificationsOn}
                      trackColor={{ false: colors.border, true: colors.accentMuted }}
                      thumbColor={notificationsOn ? colors.accent : colors.textTertiary}
                    />
                  }
                />
              </View>
              <View style={{ borderBottomColor: colors.border, borderBottomWidth: 1 }}>
                <SettingRow icon="🌙" label="Theme" value="Dark" onPress={() => {}} />
              </View>
              <SettingRow icon="📤" label="Export Data" value="CSV / PDF" onPress={() => {}} />
            </Card>
          </View>

          {/* Danger zone */}
          <View>
            <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.md }}>MORE</ThemedText>
            <Card padded={false}>
              <View style={{ borderBottomColor: colors.border, borderBottomWidth: 1 }}>
                <SettingRow icon="ℹ️" label="About" onPress={() => {}} />
              </View>
              <View style={{ borderBottomColor: colors.border, borderBottomWidth: 1 }}>
                <SettingRow icon="⭐" label="Rate the App" onPress={() => {}} />
              </View>
              <SettingRow icon="🚪" label="Sign Out" onPress={() => {}} />
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
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, alignItems: 'center', padding: 14, gap: 2 },
  settingRow: { flexDirection: 'row', alignItems: 'center' },
});
