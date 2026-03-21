import { useState } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { ApiError } from '@/services/api';

export default function ResetPasswordScreen() {
  const { colors, spacing, radii } = useTheme();
  const router = useRouter();
  const { resetPassword } = useAuth();

  const [token, setToken]           = useState('');
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [loading, setLoading]       = useState(false);
  const [done, setDone]             = useState(false);
  const [error, setError]           = useState('');

  const handleReset = async () => {
    if (!token.trim() || !password || !confirm) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await resetPassword(token.trim(), password);
      setDone(true);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingHorizontal: spacing.xl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <TouchableOpacity onPress={() => router.back()} style={{ alignSelf: 'flex-start', marginBottom: spacing['3xl'] }}>
            <ThemedText variant="bodyLg" color={colors.textSecondary}>← Back</ThemedText>
          </TouchableOpacity>

          {done ? (
            /* ── Success state ── */
            <View style={styles.successBlock}>
              <View style={[styles.iconBox, { backgroundColor: colors.incomeMuted, borderRadius: radii['2xl'] }]}>
                <ThemedText style={{ fontSize: 36 }}>✅</ThemedText>
              </View>
              <ThemedText variant="h3" style={{ marginTop: spacing.xl, textAlign: 'center' }}>
                Password updated!
              </ThemedText>
              <ThemedText
                variant="body"
                color={colors.textSecondary}
                style={{ marginTop: spacing.sm, textAlign: 'center' }}
              >
                Your password has been changed. Sign in with your new password.
              </ThemedText>
              <Button
                label="Go to Sign In"
                variant="primary"
                size="lg"
                style={{ marginTop: spacing['3xl'] }}
                onPress={() => router.replace('/auth/login')}
              />
            </View>
          ) : (
            /* ── Form state ── */
            <View>
              <ThemedText variant="h3">Set new password</ThemedText>
              <ThemedText
                variant="body"
                color={colors.textSecondary}
                style={{ marginTop: spacing.sm, marginBottom: spacing['3xl'], lineHeight: 22 }}
              >
                Paste the reset token from your email (or server console in dev mode), then enter your new password.
              </ThemedText>

              <View style={{ gap: spacing.lg }}>
                <Input
                  label="Reset Token"
                  value={token}
                  onChangeText={setToken}
                  placeholder="Paste token here"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Input
                  label="New Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 8 characters"
                  secureTextEntry
                />

                <Input
                  label="Confirm Password"
                  value={confirm}
                  onChangeText={setConfirm}
                  placeholder="Repeat your new password"
                  secureTextEntry
                  error={confirm && password !== confirm ? 'Passwords do not match' : undefined}
                />

                {error ? (
                  <View style={[styles.errorBox, { backgroundColor: colors.expenseMuted, borderRadius: radii.md }]}>
                    <ThemedText variant="bodySm" color={colors.expense}>{error}</ThemedText>
                  </View>
                ) : null}

                <Button
                  label="Reset Password"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                  onPress={handleReset}
                />
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll:       { flexGrow: 1, paddingVertical: 40 },
  successBlock: { alignItems: 'center' },
  iconBox:      { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  errorBox:     { padding: 12 },
});
