import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { joinGroup } from '@/services/group';
import { useAuth } from '@/context/auth-context';

export default function JoinGroupScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid invite link.');
      return;
    }

    // If not logged in, redirect to login; the deep link will be handled after login
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    joinGroup(token)
      .then(group => {
        setStatus('success');
        setMessage(`Joined ${group.name}!`);
        // Small delay so the user sees the success message, then navigate
        setTimeout(() => {
          router.replace(`/group/${group.id}` as any);
        }, 1200);
      })
      .catch(e => {
        setStatus('error');
        setMessage(e instanceof Error ? e.message : 'Failed to join group.');
      });
  }, [token, user]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.center}>
        {status === 'loading' && (
          <>
            <ActivityIndicator color={colors.accent} size="large" />
            <ThemedText variant="body" color={colors.textSecondary} style={{ marginTop: 16 }}>
              Joining group…
            </ThemedText>
          </>
        )}

        {status === 'success' && (
          <>
            <ThemedText style={{ fontSize: 48 }}>🎉</ThemedText>
            <ThemedText variant="h3" style={{ marginTop: 16 }}>{message}</ThemedText>
          </>
        )}

        {status === 'error' && (
          <>
            <ThemedText style={{ fontSize: 48 }}>❌</ThemedText>
            <ThemedText variant="h4" style={{ marginTop: 16 }}>Couldn't join</ThemedText>
            <ThemedText variant="body" color={colors.textSecondary} style={{ marginTop: 8, textAlign: 'center' }}>
              {message}
            </ThemedText>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
});
