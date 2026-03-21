import { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { joinGroup } from '@/services/group';
import Ionicons from '@expo/vector-icons/Ionicons';

type Status = 'scanning' | 'joining' | 'success' | 'error';

/** Extract the invite token from whatever the QR encodes:
 *  - exptracker://join/<token>  → hostname='join', pathname='/<token>'
 *  - http(s)://<host>/join/<token>
 *  - bare token string
 */
function parseToken(raw: string): string | null {
  try {
    const url = new URL(raw);
    // Custom scheme: exptracker://join/<token>
    // The URL parser puts 'join' in hostname and the token in pathname.
    if (url.hostname === 'join') {
      const token = url.pathname.replace(/^\/+/, '');
      if (token) return token;
    }
    // HTTP redirect URL: http(s)://<host>/join/<token>
    const parts = url.pathname.replace(/^\/+/, '').split('/');
    const idx = parts.indexOf('join');
    if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
  } catch {
    // Not a URL — treat as raw token
    if (/^[\w-]{10,}$/.test(raw)) return raw;
  }
  return null;
}

export default function ScanQRScreen() {
  const { colors, spacing, radii } = useTheme();
  const router = useRouter();

  const [permission, requestPermission] = useCameraPermissions();
  const [status, setStatus]   = useState<Status>('scanning');
  const [message, setMessage] = useState('');
  const [groupId, setGroupId] = useState<string | null>(null);
  const scannedRef = useRef(false);   // prevent double-firing

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, []);

  async function handleBarcode({ data }: { data: string }) {
    if (scannedRef.current || status !== 'scanning') return;
    scannedRef.current = true;

    const token = parseToken(data);
    if (!token) {
      setMessage('This QR code is not a valid group invite.');
      setStatus('error');
      return;
    }

    setStatus('joining');
    try {
      const group = await joinGroup(token);
      setGroupId(group.id);
      setMessage(`Joined "${group.name}"!`);
      setStatus('success');
      setTimeout(() => router.replace(`/group/${group.id}` as any), 1200);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed to join group.');
      setStatus('error');
    }
  }

  function reset() {
    scannedRef.current = false;
    setStatus('scanning');
    setMessage('');
  }

  if (!permission) return null; // still loading permissions

  if (!permission.granted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <ThemedText style={{ fontSize: 48 }}>📷</ThemedText>
        <ThemedText variant="h4" style={{ marginTop: 16, textAlign: 'center' }}>Camera access needed</ThemedText>
        <ThemedText variant="body" color={colors.textSecondary} style={{ marginTop: 8, textAlign: 'center' }}>
          Allow camera access to scan a group invite QR code.
        </ThemedText>
        <TouchableOpacity
          onPress={requestPermission}
          style={[styles.btn, { backgroundColor: colors.secondary, borderRadius: radii.xl, marginTop: 24 }]}
        >
          <ThemedText variant="bodyLg" bold color="#fff">Allow Camera</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <ThemedText variant="label" color={colors.textSecondary}>Go back</ThemedText>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar barStyle="light-content" />

      {/* Live camera */}
      {status === 'scanning' && (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={handleBarcode}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />
      )}

      {/* Dark overlay with cutout frame */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {/* Top bar */}
        <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.55)' }]} />

        {/* Middle row: side shade + frame + side shade */}
        <View style={{ flexDirection: 'row' }}>
          <View style={[styles.overlayH, { backgroundColor: 'rgba(0,0,0,0.55)' }]} />

          {/* Scan frame */}
          <View style={styles.frame}>
            {/* Corner marks */}
            {[{ top: 0, left: 0 }, { top: 0, right: 0 }, { bottom: 0, left: 0 }, { bottom: 0, right: 0 }].map((pos, i) => (
              <View
                key={i}
                style={[
                  styles.corner,
                  pos,
                  {
                    borderTopWidth:    pos.top    === 0 ? 3 : 0,
                    borderBottomWidth: pos.bottom === 0 ? 3 : 0,
                    borderLeftWidth:   pos.left   === 0 ? 3 : 0,
                    borderRightWidth:  pos.right  === 0 ? 3 : 0,
                    borderColor: '#C9F31D',
                  },
                ]}
              />
            ))}
          </View>

          <View style={[styles.overlayH, { backgroundColor: 'rgba(0,0,0,0.55)' }]} />
        </View>

        {/* Bottom bar */}
        <View style={[{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }]} />
      </View>

      {/* Header — close button */}
      <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <View style={[styles.header, { paddingHorizontal: spacing.xl }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[styles.closeBtn, { backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: radii.full }]}
          >
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Footer — instruction / status */}
      <SafeAreaView edges={['bottom']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <View style={[styles.footer, { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, backgroundColor: 'rgba(0,0,0,0.55)' }]}>
          {status === 'scanning' && (
            <>
              <ThemedText variant="h4" color="#fff" style={{ textAlign: 'center' }}>Scan Group Invite</ThemedText>
              <ThemedText variant="body" color="rgba(255,255,255,0.7)" style={{ textAlign: 'center', marginTop: 6 }}>
                Point your camera at a group QR code
              </ThemedText>
            </>
          )}

          {status === 'joining' && (
            <>
              <ThemedText style={{ fontSize: 36, textAlign: 'center' }}>⏳</ThemedText>
              <ThemedText variant="h4" color="#fff" style={{ textAlign: 'center', marginTop: 8 }}>Joining…</ThemedText>
            </>
          )}

          {status === 'success' && (
            <>
              <ThemedText style={{ fontSize: 36, textAlign: 'center' }}>🎉</ThemedText>
              <ThemedText variant="h4" color="#C9F31D" style={{ textAlign: 'center', marginTop: 8 }}>{message}</ThemedText>
            </>
          )}

          {status === 'error' && (
            <>
              <ThemedText style={{ fontSize: 36, textAlign: 'center' }}>❌</ThemedText>
              <ThemedText variant="h4" color="#fff" style={{ textAlign: 'center', marginTop: 8 }}>Couldn't join</ThemedText>
              <ThemedText variant="body" color="rgba(255,255,255,0.7)" style={{ textAlign: 'center', marginTop: 4 }}>{message}</ThemedText>
              <TouchableOpacity
                onPress={reset}
                style={[styles.btn, { backgroundColor: colors.secondary, borderRadius: radii.xl, marginTop: 16 }]}
              >
                <ThemedText variant="bodyLg" bold color="#fff">Try Again</ThemedText>
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const FRAME = 260;

const styles = StyleSheet.create({
  header:   { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 12 },
  closeBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  overlay:  { height: 120 },
  overlayH: { flex: 1 },
  frame:    { width: FRAME, height: FRAME, position: 'relative' },
  corner:   { position: 'absolute', width: 24, height: 24 },
  footer:   { paddingTop: 20 },
  btn:      { height: 52, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
});
