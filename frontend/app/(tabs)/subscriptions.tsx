import { ScrollView, View, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SUBSCRIPTIONS, formatCurrency, daysUntil } from '@/constants/mock-data';

export default function SubscriptionsScreen() {
  const { colors, spacing, radii } = useTheme();

  const monthlyTotal = SUBSCRIPTIONS.reduce((s, sub) => {
    if (sub.cycle === 'monthly') return s + sub.amount;
    if (sub.cycle === 'yearly')  return s + sub.amount / 12;
    return s;
  }, 0);

  const annualTotal = monthlyTotal * 12;

  const upcoming = SUBSCRIPTIONS.filter(s => daysUntil(s.nextRenewal) <= 7);

  const grouped = SUBSCRIPTIONS.reduce<Record<string, typeof SUBSCRIPTIONS>>((acc, sub) => {
    if (!acc[sub.category]) acc[sub.category] = [];
    acc[sub.category].push(sub);
    return acc;
  }, {});

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.xl, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <ThemedText variant="h3">Subscriptions</ThemedText>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.accent, borderRadius: radii.full }]}
        >
          <ThemedText variant="h4" color={colors.textOnAccent}>＋</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Cost summary hero */}
        <LinearGradient
          colors={['#1A1A1A', '#141414']}
          style={[styles.hero, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
        >
          <View style={{ alignItems: 'center' }}>
            <ThemedText variant="caption" color={colors.textSecondary} style={{ marginBottom: 4 }}>
              MONTHLY SPEND
            </ThemedText>
            <ThemedText variant="display" color={colors.accent} style={{ letterSpacing: -2 }}>
              {formatCurrency(monthlyTotal)}
            </ThemedText>
            <ThemedText variant="bodySm" color={colors.textSecondary} style={{ marginTop: 4 }}>
              {formatCurrency(annualTotal)} / year · {SUBSCRIPTIONS.length} active
            </ThemedText>
          </View>

          {/* Upcoming alert */}
          {upcoming.length > 0 && (
            <View style={[styles.alert, { backgroundColor: colors.warningMuted, borderColor: colors.warning, borderWidth: 1, borderRadius: radii.lg, marginTop: spacing.xl }]}>
              <ThemedText style={{ fontSize: 16 }}>⚡</ThemedText>
              <ThemedText variant="bodySm" color={colors.warning} style={{ marginLeft: 8 }}>
                {upcoming.length} subscription{upcoming.length > 1 ? 's' : ''} renewing this week
              </ThemedText>
            </View>
          )}
        </LinearGradient>

        <View style={{ gap: spacing.xl, paddingTop: spacing.xl, paddingHorizontal: spacing.xl }}>

          {/* Grouped by category */}
          {Object.entries(grouped).map(([category, subs]) => (
            <View key={category}>
              <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.md }}>
                {category.toUpperCase()}
              </ThemedText>
              <View style={{ gap: spacing.sm }}>
                {subs.map(sub => {
                  const days = daysUntil(sub.nextRenewal);
                  const isUrgent = days <= 3;
                  const isSoon = days <= 7;

                  return (
                    <Card key={sub.id}>
                      <View style={styles.subRow}>
                        {/* Icon with brand color dot */}
                        <View style={styles.subIconWrap}>
                          <View style={[styles.subIcon, { backgroundColor: sub.color + '22', borderRadius: radii.lg }]}>
                            <ThemedText style={{ fontSize: 24 }}>{sub.icon}</ThemedText>
                          </View>
                          <View style={[styles.brandDot, { backgroundColor: sub.color }]} />
                        </View>

                        {/* Info */}
                        <View style={{ flex: 1, marginLeft: spacing.md }}>
                          <ThemedText variant="bodyLg" semibold>{sub.name}</ThemedText>
                          <ThemedText variant="caption" color={colors.textSecondary}>
                            {sub.cycle.charAt(0).toUpperCase() + sub.cycle.slice(1)} · {
                              days > 0
                                ? `renews in ${days}d`
                                : days === 0
                                ? 'renews today'
                                : 'renewed'
                            }
                          </ThemedText>
                        </View>

                        {/* Amount + badge */}
                        <View style={{ alignItems: 'flex-end', gap: 4 }}>
                          <ThemedText variant="bodyLg" bold>
                            {sub.amount === 0 ? 'Free' : formatCurrency(sub.amount)}
                          </ThemedText>
                          {isUrgent && <Badge label="Today!" variant="expense" size="sm" />}
                          {isSoon && !isUrgent && <Badge label={`${days}d`} variant="warning" size="sm" />}
                        </View>
                      </View>
                    </Card>
                  );
                })}
              </View>
            </View>
          ))}

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
  addBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  subRow: { flexDirection: 'row', alignItems: 'center' },
  subIconWrap: { position: 'relative' },
  subIcon: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  brandDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
