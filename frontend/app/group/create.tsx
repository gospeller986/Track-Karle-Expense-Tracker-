import { useState } from 'react';
import {
  View, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, StatusBar, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { createGroup } from '@/services/group';

const GROUP_EMOJIS = [
  '🌊', '🏠', '🍱', '✈️', '🎉', '🏕️', '🎮', '🏋️',
  '🚗', '🏖️', '🎬', '🍕', '🛒', '💼', '🎵', '⚽',
  '🏔️', '🌴', '🎯', '💡', '🔥', '💎', '🌙', '🌟',
];

const SUGGESTIONS = [
  'Goa Trip', 'Flat mates', 'Office lunch', 'Weekend trip',
  'Movie night', 'Road trip', 'House party', 'College friends',
];

export default function CreateGroupScreen() {
  const { colors, spacing, radii } = useTheme();
  const router = useRouter();

  const [name, setName]           = useState('');
  const [selectedEmoji, setEmoji] = useState('🌟');
  const [description, setDesc]    = useState('');
  const [saving, setSaving]       = useState(false);

  const canCreate = name.trim().length > 0;

  async function handleCreate() {
    if (!canCreate) return;
    setSaving(true);
    try {
      const group = await createGroup({
        name: name.trim(),
        icon: selectedEmoji,
        description: description.trim() || undefined,
      });
      // Navigate directly to the group detail screen
      router.replace(`/group/${group.id}` as any);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to create group.');
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
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <ThemedText variant="h4">New Group</ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={{ gap: spacing['3xl'], paddingTop: spacing['3xl'], paddingHorizontal: spacing.xl }}>

            {/* Icon picker */}
            <View style={{ alignItems: 'center' }}>
              <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.lg }}>
                PICK AN ICON
              </ThemedText>
              <View style={[styles.iconPreview, { backgroundColor: colors.secondaryMuted, borderColor: colors.secondary, borderRadius: radii['2xl'], borderWidth: 2 }]}>
                <ThemedText style={{ fontSize: 52 }}>{selectedEmoji}</ThemedText>
              </View>
              <View style={[styles.emojiGrid, { marginTop: spacing.xl }]}>
                {GROUP_EMOJIS.map(emoji => {
                  const isSelected = emoji === selectedEmoji;
                  return (
                    <TouchableOpacity
                      key={emoji}
                      onPress={() => setEmoji(emoji)}
                      activeOpacity={0.7}
                      style={[
                        styles.emojiBtn,
                        {
                          backgroundColor: isSelected ? colors.secondaryMuted : colors.surface,
                          borderColor: isSelected ? colors.secondary : colors.border,
                          borderRadius: radii.lg,
                          borderWidth: 1.5,
                        },
                      ]}
                    >
                      <ThemedText style={{ fontSize: 24 }}>{emoji}</ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Group name */}
            <View>
              <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.sm }}>
                GROUP NAME
              </ThemedText>
              <Card>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Goa Trip 2026"
                  placeholderTextColor={colors.textTertiary}
                  style={[styles.nameInput, { color: colors.textPrimary, fontSize: 20, fontWeight: '600' }]}
                  maxLength={40}
                  returnKeyType="done"
                />
              </Card>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: spacing.md }}
                contentContainerStyle={{ gap: 8 }}
              >
                {SUGGESTIONS.map(s => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setName(s)}
                    style={[
                      styles.suggestion,
                      {
                        backgroundColor: name === s ? colors.secondaryMuted : colors.surface,
                        borderColor: name === s ? colors.secondary : colors.border,
                        borderRadius: radii.full,
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <ThemedText variant="bodySm" color={name === s ? colors.secondary : colors.textSecondary}>
                      {s}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Optional description */}
            <View>
              <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.sm }}>
                DESCRIPTION{' '}
                <ThemedText variant="label" color={colors.textTertiary}>(optional)</ThemedText>
              </ThemedText>
              <Card>
                <TextInput
                  value={description}
                  onChangeText={setDesc}
                  placeholder="What's this group for?"
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={2}
                  style={[styles.descInput, { color: colors.textPrimary }]}
                />
              </Card>
            </View>

          </View>
        </ScrollView>

        {/* Create button */}
        <View style={[styles.footer, { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, borderTopColor: colors.border, borderTopWidth: 1 }]}>
          <TouchableOpacity
            onPress={handleCreate}
            disabled={!canCreate || saving}
            activeOpacity={0.85}
            style={[
              styles.createBtn,
              {
                backgroundColor: canCreate && !saving ? colors.secondary : colors.surfaceElevated,
                borderRadius: radii.xl,
                opacity: canCreate ? 1 : 0.5,
              },
            ]}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="people" size={20} color={canCreate ? '#fff' : colors.textTertiary} style={{ marginRight: spacing.sm }} />
                <ThemedText variant="bodyLg" bold color={canCreate ? '#fff' : colors.textTertiary}>
                  Create Group
                </ThemedText>
              </>
            )}
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  iconPreview: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  emojiGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  emojiBtn:    { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  nameInput:   { paddingVertical: 4, letterSpacing: -0.3 },
  suggestion:  { paddingHorizontal: 14, paddingVertical: 8 },
  descInput:   { fontSize: 15, paddingVertical: 4, textAlignVertical: 'top', minHeight: 56 },
  footer:      { paddingTop: 16 },
  createBtn:   { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
