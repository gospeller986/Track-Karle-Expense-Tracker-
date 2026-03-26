import { useCallback } from 'react';
import {
  ScrollView, View, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGroups } from '@/hooks/use-groups';
import { formatCurrency } from '@/constants/mock-data';
import type { Group } from '@/interfaces/group';

const AVATAR_COLORS = ['#C9F31D', '#7B61FF', '#FF4D4D', '#00C48C', '#FF8A00', '#4D9EFF'];

function MemberAvatars({ group }: { group: Group }) {
  const { colors } = useTheme();
  const visible = group.members.slice(0, 3);
  const extra   = group.members.length - 3;

  return (
    <View style={styles.avatarStack}>
      {visible.map((m, i) => (
        <View
          key={m.id}
          style={[
            styles.memberAvatar,
            { backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] + '22', borderColor: colors.surface, marginLeft: i > 0 ? -10 : 0 },
          ]}
        >
          <ThemedText variant="caption" color={AVATAR_COLORS[i % AVATAR_COLORS.length]} bold>{m.initials}</ThemedText>
        </View>
      ))}
      {extra > 0 && (
        <View style={[styles.memberAvatar, { backgroundColor: colors.surfaceElevated, borderColor: colors.surface, marginLeft: -10 }]}>
          <ThemedText variant="caption" color={colors.textSecondary}>+{extra}</ThemedText>
        </View>
      )}
    </View>
  );
}

export default function GroupsScreen() {
  const { colors, spacing, radii, isDark } = useTheme();
  const router = useRouter();
  const { groups, isLoading, refetch } = useGroups();

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  const totalOwed = groups.filter(g => g.yourBalance > 0).reduce((s, g) => s + g.yourBalance, 0);
  const totalOwe  = groups.filter(g => g.yourBalance < 0).reduce((s, g) => s + Math.abs(g.yourBalance), 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.xl, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <ThemedText variant="h3">Groups</ThemedText>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <TouchableOpacity
            onPress={() => router.push('/group/scan' as any)}
            style={[styles.iconBtn, { backgroundColor: colors.surface, borderRadius: radii.full }]}
          >
            <Ionicons name="qr-code-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/group/create' as any)}
            style={[styles.iconBtn, { backgroundColor: colors.secondary, borderRadius: radii.full }]}
          >
            <ThemedText variant="h4" color="#fff">＋</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Balance summary */}
        <LinearGradient
          colors={isDark ? ['#1A1A1A', '#141414'] : [colors.bgElevated, colors.surface]}
          style={[styles.summaryBar, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
        >
          <View style={styles.summaryItem}>
            <ThemedText variant="caption" color={colors.textSecondary}>You're owed</ThemedText>
            <ThemedText variant="h3" color={colors.income}>{formatCurrency(totalOwed)}</ThemedText>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <ThemedText variant="caption" color={colors.textSecondary}>You owe</ThemedText>
            <ThemedText variant="h3" color={colors.expense}>{formatCurrency(totalOwe)}</ThemedText>
          </View>
        </LinearGradient>

        {isLoading && <ActivityIndicator color={colors.secondary} style={{ marginTop: 40 }} />}

        {!isLoading && groups.length === 0 && (
          <View style={styles.empty}>
            <ThemedText style={{ fontSize: 48 , paddingTop : 40 }}>👥</ThemedText>
            <ThemedText variant="h4" style={{ marginTop: 16 }}>No groups yet</ThemedText>
            <ThemedText variant="body" color={colors.textSecondary} style={{ marginTop: 8, textAlign: 'center' }}>
              Tap ＋ to create a group and invite friends via QR code
            </ThemedText>
            </View>
        )}

        {!isLoading && groups.length > 0 && (
          <View style={{ gap: spacing.xl, paddingTop: spacing.xl, paddingHorizontal: spacing.xl }}>
            <View>
              <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.md }}>
                YOUR GROUPS
              </ThemedText>
              <View style={{ gap: spacing.md }}>
                {groups.map(group => {
                  const owed    = group.yourBalance > 0;
                  const settled = group.yourBalance === 0;

                  return (
                    <Card key={group.id} onPress={() => router.push(`/group/${group.id}` as any)} elevated={false}>
                      <View style={styles.groupTop}>
                        <View style={[styles.groupIcon, { backgroundColor: colors.secondaryMuted, borderRadius: radii.lg }]}>
                          <ThemedText style={{ fontSize: 24 }}>{group.icon}</ThemedText>
                        </View>
                        <View style={{ flex: 1, marginLeft: spacing.md }}>
                          <ThemedText variant="bodyLg" semibold>{group.name}</ThemedText>
                          <ThemedText variant="caption" color={colors.textSecondary}>
                            {group.memberCount} member{group.memberCount !== 1 ? 's' : ''} · {formatCurrency(group.totalExpenses)} total
                          </ThemedText>
                        </View>
                        {!settled && (
                          <Badge
                            label={`${owed ? '+' : '-'}${formatCurrency(Math.abs(group.yourBalance))}`}
                            variant={owed ? 'income' : 'expense'}
                          />
                        )}
                      </View>

                      <View style={[styles.groupBottom, { marginTop: spacing.md, paddingTop: spacing.md, borderTopColor: colors.border, borderTopWidth: 1 }]}>
                        <MemberAvatars group={group} />
                        {settled && <Badge label="All settled" variant="income" size="sm" />}
                      </View>
                    </Card>
                  );
                })}
              </View>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  iconBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  summaryBar:  { flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 20 },
  summaryItem: { flex: 1, gap: 4 },
  summaryDivider: { width: 1, marginHorizontal: 20 },
  groupTop:    { flexDirection: 'row', alignItems: 'center' },
  groupIcon:   { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  groupBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avatarStack: { flexDirection: 'row', alignItems: 'center' },
  memberAvatar: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  empty:       { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
});
