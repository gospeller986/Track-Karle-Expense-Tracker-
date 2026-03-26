import { useCallback } from 'react';
import {
  ScrollView, View, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { useSubscriptions } from '@/hooks/use-subscriptions';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/constants/mock-data';

function daysUntil(isoDate: string): number {
  const target = new Date(isoDate);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function SubscriptionsScreen() {
  const { colors, spacing, radii, isDark } = useTheme();
  const router = useRouter();
  const { subscriptions, summary, isLoading, refetch } = useSubscriptions();

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  const upcoming = subscriptions.filter(s => daysUntil(s.nextRenewal) <= 7);

  const grouped = subscriptions.reduce<Record<string, typeof subscriptions>>((acc, sub) => {
    const key = sub.category || 'Other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(sub);
    return acc;
  }, {});

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.xl, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <ThemedText variant="h3">Subscriptions</ThemedText>
        <TouchableOpacity
          onPress={() => router.push('/subscription/add' as any)}
          style={[styles.addBtn, { backgroundColor: colors.accent, borderRadius: radii.full }]}
        >
          <ThemedText variant="h4" color={colors.textOnAccent}>＋</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Cost summary hero */}
        <LinearGradient
          colors={isDark ? ['#1A1A1A', '#141414'] : [colors.bgElevated, colors.surface]}
          style={[styles.hero, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
        >
          <View style={{ alignItems: 'center' }}>
            <ThemedText variant="caption" color={colors.textSecondary} style={{ marginBottom: 4 }}>
              MONTHLY SPEND
            </ThemedText>
            <ThemedText variant="display" color={colors.accent} style={{ letterSpacing: -2 }}>
              {formatCurrency(summary?.monthlyTotal ?? 0)}
            </ThemedText>
            <ThemedText variant="bodySm" color={colors.textSecondary} style={{ marginTop: 4 }}>
              {formatCurrency(summary?.yearlyTotal ?? 0)} / year · {summary?.count ?? 0} active
            </ThemedText>
          </View>

          {upcoming.length > 0 && (
            <View style={[styles.alert, { backgroundColor: colors.warningMuted, borderColor: colors.warning, borderWidth: 1, borderRadius: radii.lg, marginTop: spacing.xl }]}>
              <ThemedText style={{ fontSize: 16 }}>⚡</ThemedText>
              <ThemedText variant="bodySm" color={colors.warning} style={{ marginLeft: 8 }}>
                {upcoming.length} subscription{upcoming.length > 1 ? 's' : ''} renewing this week
              </ThemedText>
            </View>
          )}
        </LinearGradient>

        {isLoading && (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
        )}

        {!isLoading && subscriptions.length === 0 && (
          <View style={styles.empty}>
            <ThemedText style={{ fontSize: 48 , paddingTop : 40 }}>📱</ThemedText>
            <ThemedText variant="h4" style={{ marginTop: 16 }}>No subscriptions yet</ThemedText>
            <ThemedText variant="body" color={colors.textSecondary} style={{ marginTop: 8, textAlign: 'center' }}>
              Tap ＋ to start tracking your recurring payments
            </ThemedText>
          </View>
        )}

        {!isLoading && subscriptions.length > 0 && (
          <View style={{ gap: spacing.xl, paddingTop: spacing.xl, paddingHorizontal: spacing.xl }}>
            {Object.entries(grouped).map(([category, subs]) => (
              <View key={category}>
                <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.md }}>
                  {category.toUpperCase()}
                </ThemedText>
                <View style={{ gap: spacing.sm }}>
                  {subs.map(sub => {
                    const days = daysUntil(sub.nextRenewal);
                    const isUrgent = days <= 3;
                    const isSoon   = days <= 7;
                    return (
                      <TouchableOpacity
                        key={sub.id}
                        activeOpacity={0.75}
                        onPress={() => router.push(`/subscription/${sub.id}` as any)}
                      >
                        <Card>
                          <View style={styles.subRow}>
                            <View style={styles.subIconWrap}>
                              <View style={[styles.subIcon, { backgroundColor: sub.color + '22', borderRadius: radii.lg }]}>
                                <ThemedText style={{ fontSize: 24 }}>{sub.icon}</ThemedText>
                              </View>
                              <View style={[styles.brandDot, { backgroundColor: sub.color }]} />
                            </View>

                            <View style={{ flex: 1, marginLeft: spacing.md }}>
                              <ThemedText variant="bodyLg" semibold>{sub.name}</ThemedText>
                              <ThemedText variant="caption" color={colors.textSecondary}>
                                {sub.cycle.charAt(0).toUpperCase() + sub.cycle.slice(1)} ·{' '}
                                {days > 0 ? `renews in ${days}d` : days === 0 ? 'renews today' : 'renewed'}
                              </ThemedText>
                            </View>

                            <View style={{ alignItems: 'flex-end', gap: 4 }}>
                              <ThemedText variant="bodyLg" semibold>
                                {sub.amount === 0 ? 'Free' : formatCurrency(sub.amount)}
                              </ThemedText>
                              {isUrgent && <Badge label="Today!" variant="expense" size="sm" />}
                              {isSoon && !isUrgent && <Badge label={`${days}d`} variant="warning" size="sm" />}
                            </View>
                          </View>
                        </Card>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  addBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  hero:        { paddingHorizontal: 24, paddingVertical: 32 },
  alert:       { flexDirection: 'row', alignItems: 'center', padding: 12 },
  empty:       { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  subRow:      { flexDirection: 'row', alignItems: 'center' },
  subIconWrap: { position: 'relative' },
  subIcon:     { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  brandDot:    { position: 'absolute', bottom: -2, right: -2, width: 12, height: 12, borderRadius: 6 },
});
