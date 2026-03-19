import { useState } from 'react';
import {
  View, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, StatusBar, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GROUP_MEMBERS } from '@/constants/mock-data';
import type { GroupMember } from '@/constants/mock-data';

// All available friends (excluding "You")
const FRIEND_LIST: GroupMember[] = GROUP_MEMBERS.filter(m => m.id !== 'u1');

// Avatar colors — cycles through for visual variety
const AVATAR_COLORS = ['#7B61FF', '#FF4D4D', '#00C48C', '#FF8A00', '#4D9EFF', '#FF4D9E'];

function avatarColor(idx: number) {
  return AVATAR_COLORS[idx % AVATAR_COLORS.length];
}

type InvitedContact = {
  id: string;
  name: string;
  initials: string;
  email?: string;
  isNew?: boolean; // manually added, not in friends list
};

export default function AddMembersScreen() {
  const { colors, spacing, radii } = useTheme();
  const router = useRouter();
  const { name: groupName, emoji } = useLocalSearchParams<{ name: string; emoji: string }>();

  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState<InvitedContact[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInviteInput, setShowInviteInput] = useState(false);

  const filteredFriends = FRIEND_LIST.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const isSelected = (id: string) => selected.some(s => s.id === id);

  function toggleFriend(friend: GroupMember) {
    if (isSelected(friend.id)) {
      setSelected(prev => prev.filter(s => s.id !== friend.id));
    } else {
      setSelected(prev => [...prev, { id: friend.id, name: friend.name, initials: friend.initials }]);
    }
  }

  function handleInvite() {
    const val = inviteEmail.trim();
    if (!val) return;

    // Basic validation: looks like an email or a name
    const isEmail = val.includes('@');
    const initials = val
      .split(/[\s@.]+/)
      .slice(0, 2)
      .map(p => p[0]?.toUpperCase() ?? '')
      .join('');

    const newContact: InvitedContact = {
      id: `new_${Date.now()}`,
      name: isEmail ? val.split('@')[0] : val,
      initials: initials || val.slice(0, 2).toUpperCase(),
      email: isEmail ? val : undefined,
      isNew: true,
    };

    setSelected(prev => [...prev, newContact]);
    setInviteEmail('');
    setShowInviteInput(false);
  }

  function handleCreate() {
    // In a real app: POST /groups with name, emoji, members
    // For now: show success and go back to groups
    Alert.alert(
      `${emoji} ${groupName} created!`,
      `Group created with ${selected.length + 1} member${selected.length !== 0 ? 's' : ''} (including you).`,
      [{ text: 'Done', onPress: () => router.dismissAll() }]
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: spacing.xl, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={{ alignItems: 'center' }}>
            <ThemedText variant="h4">Add Members</ThemedText>
            <ThemedText variant="caption" color={colors.textSecondary}>
              {emoji} {groupName}
            </ThemedText>
          </View>

          {/* Step indicator */}
          <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, { backgroundColor: colors.accent }]} />
            <View style={[styles.stepDot, { backgroundColor: colors.accent }]} />
          </View>
        </View>

        {/* Selected members strip */}
        {selected.length > 0 && (
          <View style={[styles.selectedStrip, { borderBottomColor: colors.border, borderBottomWidth: 1, backgroundColor: colors.bgElevated }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 12, paddingVertical: spacing.sm }}>
              {/* Always show "You" first */}
              <View style={styles.selectedChip}>
                <View style={[styles.chipAvatar, { backgroundColor: colors.accentMuted }]}>
                  <ThemedText variant="caption" color={colors.accent} bold>YO</ThemedText>
                </View>
                <ThemedText variant="caption" color={colors.textSecondary} style={{ marginTop: 4 }}>You</ThemedText>
              </View>

              {selected.map((s, idx) => (
                <TouchableOpacity key={s.id} onPress={() => setSelected(prev => prev.filter(p => p.id !== s.id))} style={styles.selectedChip}>
                  <View style={[styles.chipAvatar, { backgroundColor: avatarColor(idx) + '33' }]}>
                    <ThemedText variant="caption" color={avatarColor(idx)} bold>{s.initials}</ThemedText>
                    {/* Remove badge */}
                    <View style={[styles.removeDot, { backgroundColor: colors.expense }]}>
                      <Ionicons name="close" size={8} color="#fff" />
                    </View>
                  </View>
                  <ThemedText variant="caption" color={colors.textSecondary} style={{ marginTop: 4 }} numberOfLines={1}>
                    {s.name.split(' ')[0]}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={{ gap: spacing.xl, paddingTop: spacing.xl }}>

            {/* Search bar */}
            <View style={{ paddingHorizontal: spacing.xl }}>
              <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.xl, borderWidth: 1 }]}>
                <Ionicons name="search" size={18} color={colors.textTertiary} style={{ marginRight: spacing.sm }} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search friends..."
                  placeholderTextColor={colors.textTertiary}
                  style={[styles.searchInput, { color: colors.textPrimary, fontSize: 15 }]}
                  returnKeyType="search"
                  clearButtonMode="while-editing"
                />
              </View>
            </View>

            {/* Friends list */}
            <View style={{ paddingHorizontal: spacing.xl }}>
              <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.md }}>
                YOUR FRIENDS
              </ThemedText>

              {filteredFriends.length > 0 ? (
                <Card padded={false}>
                  {filteredFriends.map((friend, idx) => {
                    const selected_ = isSelected(friend.id);
                    const isLast = idx === filteredFriends.length - 1;
                    const color = avatarColor(idx);

                    return (
                      <TouchableOpacity
                        key={friend.id}
                        onPress={() => toggleFriend(friend)}
                        activeOpacity={0.7}
                        style={[
                          styles.friendRow,
                          { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
                          !isLast && { borderBottomColor: colors.border, borderBottomWidth: 1 },
                          selected_ && { backgroundColor: colors.secondaryMuted },
                        ]}
                      >
                        {/* Avatar */}
                        <View style={[styles.avatar, { backgroundColor: color + '22' }]}>
                          <ThemedText variant="label" color={color}>{friend.initials}</ThemedText>
                        </View>

                        {/* Name */}
                        <View style={{ flex: 1, marginLeft: spacing.md }}>
                          <ThemedText variant="bodySm" semibold>{friend.name}</ThemedText>
                          <ThemedText variant="caption" color={colors.textSecondary}>Friend</ThemedText>
                        </View>

                        {/* Checkbox */}
                        <View
                          style={[
                            styles.checkbox,
                            {
                              backgroundColor: selected_ ? colors.secondary : 'transparent',
                              borderColor: selected_ ? colors.secondary : colors.border,
                              borderRadius: radii.full,
                              borderWidth: 2,
                            },
                          ]}
                        >
                          {selected_ && <Ionicons name="checkmark" size={14} color="#fff" />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </Card>
              ) : (
                <View style={styles.noResults}>
                  <ThemedText variant="body" color={colors.textTertiary}>No friends found</ThemedText>
                </View>
              )}
            </View>

            {/* Invite by email/name */}
            <View style={{ paddingHorizontal: spacing.xl }}>
              <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.md }}>
                INVITE SOMEONE NEW
              </ThemedText>

              {!showInviteInput ? (
                <TouchableOpacity
                  onPress={() => setShowInviteInput(true)}
                  style={[styles.inviteBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.xl, borderWidth: 1 }]}
                >
                  <View style={[styles.inviteIcon, { backgroundColor: colors.secondaryMuted, borderRadius: radii.full }]}>
                    <Ionicons name="person-add-outline" size={18} color={colors.secondary} />
                  </View>
                  <View style={{ marginLeft: spacing.md }}>
                    <ThemedText variant="bodySm" semibold>Invite by email or name</ThemedText>
                    <ThemedText variant="caption" color={colors.textSecondary}>They'll get a link to join</ThemedText>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
              ) : (
                <Card>
                  <View style={styles.inviteInputRow}>
                    <TextInput
                      value={inviteEmail}
                      onChangeText={setInviteEmail}
                      placeholder="Email address or name"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoFocus
                      returnKeyType="done"
                      onSubmitEditing={handleInvite}
                      style={[styles.inviteInput, { color: colors.textPrimary, fontSize: 15 }]}
                    />
                    <TouchableOpacity
                      onPress={handleInvite}
                      disabled={!inviteEmail.trim()}
                      style={[
                        styles.inviteSendBtn,
                        { backgroundColor: inviteEmail.trim() ? colors.secondary : colors.surfaceElevated, borderRadius: radii.lg },
                      ]}
                    >
                      <Ionicons name="send" size={16} color={inviteEmail.trim() ? '#fff' : colors.textTertiary} />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity onPress={() => { setShowInviteInput(false); setInviteEmail(''); }} style={{ marginTop: spacing.sm }}>
                    <ThemedText variant="caption" color={colors.textTertiary}>Cancel</ThemedText>
                  </TouchableOpacity>
                </Card>
              )}

              {/* Newly invited contacts */}
              {selected.filter(s => s.isNew).length > 0 && (
                <View style={{ marginTop: spacing.md }}>
                  <ThemedText variant="caption" color={colors.textSecondary} style={{ marginBottom: spacing.sm }}>PENDING INVITES</ThemedText>
                  <Card padded={false}>
                    {selected.filter(s => s.isNew).map((contact, idx, arr) => (
                      <View
                        key={contact.id}
                        style={[
                          styles.friendRow,
                          { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
                          idx < arr.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 },
                        ]}
                      >
                        <View style={[styles.avatar, { backgroundColor: colors.secondaryMuted }]}>
                          <ThemedText variant="label" color={colors.secondary}>{contact.initials}</ThemedText>
                        </View>
                        <View style={{ flex: 1, marginLeft: spacing.md }}>
                          <ThemedText variant="bodySm" semibold>{contact.name}</ThemedText>
                          {contact.email && (
                            <ThemedText variant="caption" color={colors.textSecondary}>{contact.email}</ThemedText>
                          )}
                        </View>
                        <Badge label="Invited" variant="secondary" size="sm" />
                        <TouchableOpacity
                          onPress={() => setSelected(prev => prev.filter(p => p.id !== contact.id))}
                          style={{ marginLeft: spacing.md }}
                        >
                          <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </Card>
                </View>
              )}
            </View>

          </View>
        </ScrollView>

        {/* Create group CTA */}
        <View style={[styles.footer, { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, borderTopColor: colors.border, borderTopWidth: 1, gap: spacing.sm }]}>
          {selected.length === 0 && (
            <ThemedText variant="caption" color={colors.textTertiary} style={{ textAlign: 'center' }}>
              You can also create the group and add members later
            </ThemedText>
          )}

          <TouchableOpacity
            onPress={handleCreate}
            activeOpacity={0.85}
            style={[styles.createBtn, { backgroundColor: colors.secondary, borderRadius: radii.xl }]}
          >
            <Ionicons name="people" size={20} color="#fff" style={{ marginRight: spacing.sm }} />
            <ThemedText variant="bodyLg" bold color="#fff">
              Create Group
              {selected.length > 0 ? ` · ${selected.length + 1} members` : ''}
            </ThemedText>
          </TouchableOpacity>
        </View>

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
  stepIndicator: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  stepDot: { width: 20, height: 4, borderRadius: 2 },
  selectedStrip: { paddingVertical: 4 },
  selectedChip: { alignItems: 'center', width: 52 },
  chipAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  removeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 48,
  },
  searchInput: { flex: 1 },
  friendRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResults: { alignItems: 'center', paddingVertical: 24 },
  inviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  inviteIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  inviteInput: { flex: 1, paddingVertical: 4 },
  inviteSendBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { paddingTop: 16 },
  createBtn: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
