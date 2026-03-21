import { useCallback, useEffect, useState } from 'react';
import {
  ScrollView, View, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { getGroup, deleteGroup } from '@/services/group';
import { formatCurrency } from '@/constants/mock-data';
import { useAuth } from '@/context/auth-context';
import type { Group } from '@/interfaces/group';

const AVATAR_COLORS = ['#C9F31D', '#7B61FF', '#FF4D4D', '#00C48C', '#FF8A00', '#4D9EFF'];

function avatarColor(i: number) { return AVATAR_COLORS[i % AVATAR_COLORS.length]; }

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radii } = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  const [group, setGroup]       = useState<Group | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setGroup(await getGroup(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load group');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleDelete() {
    if (!group) return;
    Alert.alert(
      'Delete Group',
      `Delete "${group.name}"? All expenses and settlements will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            try {
              await deleteGroup(group.id);
              router.back();
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Failed to delete.');
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

  if (error || !group) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }} edges={['top']}>
        <ThemedText variant="body" color={colors.expense}>{error ?? 'Group not found.'}</ThemedText>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <ThemedText variant="label" color={colors.accent}>Go back</ThemedText>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const owed      = group.yourBalance > 0;
  const settled   = group.yourBalance === 0;
  const isCreator = group.createdBy === user?.id;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.xl, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <ThemedText variant="h4">{group.icon} {group.name}</ThemedText>
          <ThemedText variant="caption" color={colors.textSecondary}>{group.memberCount} member{group.memberCount !== 1 ? 's' : ''}</ThemedText>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {isCreator && (
            <TouchableOpacity
              onPress={handleDelete}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[styles.headerBtn, { backgroundColor: colors.expenseMuted, borderRadius: radii.full }]}
            >
              <Ionicons name="trash-outline" size={18} color={colors.expense} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/group/invite', params: { groupId: group.id, groupName: group.name } } as any)}
            style={[styles.headerBtn, { backgroundColor: colors.secondary, borderRadius: radii.full }]}
          >
            <Ionicons name="person-add-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Hero balance */}
        <LinearGradient
          colors={['#1A1A1A', '#141414']}
          style={[styles.hero, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
        >
          <View style={{ alignItems: 'center' }}>
            <ThemedText variant="caption" color={colors.textSecondary}>YOUR BALANCE</ThemedText>
            {settled ? (
              <ThemedText variant="h2" color={colors.income} style={{ marginTop: 4 }}>All settled up ✓</ThemedText>
            ) : (
              <>
                <ThemedText variant="display" color={owed ? colors.income : colors.expense} style={{ marginTop: 4, letterSpacing: -2 }}>
                  {formatCurrency(Math.abs(group.yourBalance))}
                </ThemedText>
                <ThemedText variant="bodySm" color={colors.textSecondary} style={{ marginTop: 4 }}>
                  {owed ? 'the group owes you' : 'you owe the group'}
                </ThemedText>
              </>
            )}
          </View>
          <ThemedText variant="caption" color={colors.textTertiary} style={{ marginTop: spacing.md }}>
            Total group spend: {formatCurrency(group.totalExpenses)}
          </ThemedText>
        </LinearGradient>

        <View style={{ gap: spacing.xl, paddingTop: spacing.xl, paddingHorizontal: spacing.xl }}>

          {/* Members */}
          <View>
            <View style={styles.sectionHeader}>
              <ThemedText variant="label" color={colors.textSecondary}>MEMBERS</ThemedText>
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/group/invite', params: { groupId: group.id, groupName: group.name } } as any)}
              >
                <ThemedText variant="caption" color={colors.secondary}>+ Invite</ThemedText>
              </TouchableOpacity>
            </View>
            <Card padded={false}>
              {group.members.map((member, idx) => (
                <View
                  key={member.id}
                  style={[
                    styles.memberRow,
                    { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
                    idx < group.members.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 },
                  ]}
                >
                  <View style={[styles.avatar, { backgroundColor: avatarColor(idx) + '22' }]}>
                    <ThemedText variant="caption" color={avatarColor(idx)} bold>{member.initials}</ThemedText>
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <ThemedText variant="bodySm" semibold>
                      {member.id === user?.id ? 'You' : member.name}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </Card>
          </View>

          {/* Expenses — empty state (full CRUD coming next) */}
          <View>
            <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: 0 }}>EXPENSES</ThemedText>
            <View style={styles.emptyBox}>
              <ThemedText style={{ fontSize: 40 }}>🧾</ThemedText>
              <ThemedText variant="h4" style={{ marginTop: 12 }}>No expenses yet</ThemedText>
              <ThemedText variant="body" color={colors.textSecondary} style={{ marginTop: 6, textAlign: 'center' }}>
                Tap + to add the first expense for this group
              </ThemedText>
            </View>
          </View>


        </View>
      </ScrollView>

      {/* FAB */}
      <View style={[styles.fab, { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl }]}>
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/group/add-expense', params: { groupId: group.id } } as any)}
          activeOpacity={0.85}
          style={[styles.fabBtn, { backgroundColor: colors.secondary, borderRadius: radii.xl }]}
        >
          <Ionicons name="add-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <ThemedText variant="bodyLg" bold color="#fff">Add Group Expense</ThemedText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  inviteBtn:   { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerBtn:   { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  hero:        { paddingHorizontal: 24, paddingVertical: 28, alignItems: 'center', gap: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  memberRow:   { flexDirection: 'row', alignItems: 'center' },
  avatar:      { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  emptyBox:    { alignItems: 'center', paddingVertical: 48 },
  fab:         { position: 'absolute', bottom: 0, left: 0, right: 0 },
  fabBtn:      { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
