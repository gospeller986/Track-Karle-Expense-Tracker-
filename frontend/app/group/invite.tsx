import { useCallback, useEffect, useState } from 'react';
import {
  View, TouchableOpacity, StyleSheet, StatusBar,
  Share, ActivityIndicator, Alert, Platform, Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { generateInvite } from '@/services/group';
import type { GroupInvite } from '@/interfaces/group';

export default function GroupInviteScreen() {
  const { groupId, groupName } = useLocalSearchParams<{ groupId: string; groupName: string }>();
  const { colors, spacing, radii } = useTheme();
  const router = useRouter();

  const [invite, setInvite]     = useState<GroupInvite | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const fetchInvite = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRotating(true);
    setError(null);
    try {
      const data = await generateInvite(groupId);
      setInvite(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate invite');
    } finally {
      setLoading(false);
      setRotating(false);
    }
  }, [groupId]);

  useEffect(() => { fetchInvite(); }, [fetchInvite]);

  async function handleShare() {
    if (!invite) return;
    // exptracker:// is registered in app.json — iOS iMessage and Safari recognise it as tappable.
    // On Android / WhatsApp there is no custom-scheme support without a real HTTPS domain,
    // so we include the link in the message body too so the user can copy-paste into a browser.
    const deepLink = `exptracker://join/${invite.inviteToken}`;
    const body = `Join my group "${invite.groupName}" on Expense Tracker!\n\n${deepLink}`;
    try {
      await Share.share(
        Platform.OS === 'ios'
          ? { message: body, url: deepLink }   // url field → iMessage shows it as a tappable link
          : { message: body, title: `Join ${invite.groupName}` },
      );
    } catch {
      // dismissed
    }
  }

  async function handleRotate() {
    Alert.alert(
      'Regenerate Link',
      "The old QR code and link will stop working. Anyone with the old link won't be able to join.",
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Regenerate', style: 'destructive', onPress: () => fetchInvite(false) },
      ],
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.xl, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <ThemedText variant="h4">Invite Members</ThemedText>
          <ThemedText variant="caption" color={colors.textSecondary}>{groupName}</ThemedText>
        </View>
        <TouchableOpacity
          onPress={handleRotate}
          disabled={rotating || isLoading}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {rotating
            ? <ActivityIndicator size="small" color={colors.textSecondary} />
            : <Ionicons name="refresh-outline" size={22} color={colors.textSecondary} />
          }
        </TouchableOpacity>
      </View>

      <View style={[styles.content, { paddingHorizontal: spacing.xl }]}>

        <ThemedText variant="body" color={colors.textSecondary} style={{ textAlign: 'center', marginBottom: spacing.xl }}>
          Scan the QR code or tap Share Invite to send via iMessage, WhatsApp, and more.
        </ThemedText>

        {isLoading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator color={colors.accent} size="large" />
          </View>
        ) : error ? (
          <View style={styles.loaderBox}>
            <ThemedText variant="body" color={colors.expense}>{error}</ThemedText>
            <TouchableOpacity onPress={() => fetchInvite()} style={{ marginTop: 16 }}>
              <ThemedText variant="label" color={colors.accent}>Retry</ThemedText>
            </TouchableOpacity>
          </View>
        ) : invite ? (
          <>
            {/* QR — encodes the deep link directly; use the in-app scanner (QR icon on Groups tab) */}
            <Card style={{ alignItems: 'center', paddingVertical: spacing['3xl'] }}>
              <View style={[styles.qrWrapper, { backgroundColor: '#fff', borderRadius: radii.xl, padding: 16 }]}>
                <QRCode
                  value={`exptracker://join/${invite.inviteToken}`}
                  size={200}
                  color="#000"
                  backgroundColor="#fff"
                />
              </View>
              <ThemedText variant="caption" color={colors.textTertiary} style={{ marginTop: spacing.lg, textAlign: 'center' }}>
                Scan with the QR scanner in the Groups tab
              </ThemedText>
            </Card>

            {/* Copyable link — long-press to select & copy; useful for WhatsApp users */}
            <View style={[styles.linkRow, { backgroundColor: colors.surface, borderRadius: radii.lg, marginTop: spacing.lg, borderColor: colors.border, borderWidth: 1 }]}>
              <Ionicons name="link-outline" size={16} color={colors.textTertiary} style={{ marginRight: 8, flexShrink: 0 }} />
              <Text
                selectable
                numberOfLines={1}
                ellipsizeMode="middle"
                style={[styles.linkText, { color: colors.textSecondary }]}
              >
                {`exptracker://join/${invite.inviteToken}`}
              </Text>
            </View>
            <ThemedText variant="caption" color={colors.textTertiary} style={{ marginTop: 6, marginLeft: 4 }}>
              Long-press the link above to copy it
            </ThemedText>

            {/* Share button */}
            <TouchableOpacity
              onPress={handleShare}
              activeOpacity={0.85}
              style={[styles.shareBtn, { backgroundColor: colors.secondary, borderRadius: radii.xl, marginTop: spacing.lg }]}
            >
              <Ionicons name="share-social-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <ThemedText variant="bodyLg" bold color="#fff">Share Invite</ThemedText>
            </TouchableOpacity>

            {/* Hint */}
            <View style={[styles.hint, { backgroundColor: colors.surface, borderRadius: radii.lg, marginTop: spacing.md }]}>
              <Ionicons name="information-circle-outline" size={18} color={colors.textTertiary} />
              <ThemedText variant="caption" color={colors.textTertiary} style={{ flex: 1, marginLeft: 8 }}>
                Ask the other person to tap the QR icon on the Groups tab to scan. Tap refresh to generate a new link and invalidate the old one.
              </ThemedText>
            </View>
          </>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  content:  { flex: 1, paddingTop: 32, alignItems: 'stretch' },
  loaderBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  qrWrapper: { alignItems: 'center', justifyContent: 'center' },
  linkRow:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  linkText: { flex: 1, fontFamily: 'monospace', fontSize: 13 },
  shareBtn: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  hint:     { flexDirection: 'row', alignItems: 'flex-start', padding: 12 },
});
