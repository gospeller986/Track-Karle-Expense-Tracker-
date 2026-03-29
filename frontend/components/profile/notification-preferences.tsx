import { ActivityIndicator, Switch, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { useNotificationPreferences } from '@/hooks/use-notification-preferences';
import type { UpdatePreferencesPayload } from '@/interfaces/notification';

const PREF_ROWS: { key: keyof UpdatePreferencesPayload; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'groupExpenseAdded',    label: 'Group Expenses',         icon: 'people-outline' },
  { key: 'settlementCreated',    label: 'Settlements',            icon: 'cash-outline' },
  { key: 'groupInvite',          label: 'Group Invites',          icon: 'mail-outline' },
  { key: 'subscriptionReminders',label: 'Subscription Reminders', icon: 'repeat-outline' },
  { key: 'budgetAlerts',         label: 'Budget Alerts',          icon: 'alert-circle-outline' },
];

export function NotificationPreferences() {
  const { colors, spacing } = useTheme();
  const { preferences, isLoading, isSaving, updatePreferences } = useNotificationPreferences();

  if (isLoading) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: spacing.md }}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  }

  if (!preferences) return null;

  return (
    <Card padded={false}>
      {PREF_ROWS.map((row, idx) => (
        <View
          key={row.key}
          style={idx < PREF_ROWS.length - 1 ? { borderBottomColor: colors.border, borderBottomWidth: 1 } : undefined}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
            <Ionicons name={row.icon} size={20} color={colors.accent} style={{ width: 28 }} />
            <ThemedText variant="bodySm" semibold style={{ flex: 1, marginLeft: spacing.md }}>{row.label}</ThemedText>
            {isSaving
              ? <ActivityIndicator size="small" color={colors.accent} />
              : (
                <Switch
                  value={preferences[row.key] as boolean}
                  onValueChange={value => updatePreferences({ [row.key]: value })}
                  trackColor={{ false: colors.border, true: colors.accentMuted }}
                  thumbColor={preferences[row.key] ? colors.accent : colors.textTertiary}
                />
              )
            }
          </View>
        </View>
      ))}
    </Card>
  );
}
