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

export default function ForgotPasswordScreen() {
  const { colors, spacing, radii } = useTheme();
  const router = useRouter();
  const { forgotPassword } = useAuth();

  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email.trim().toLowerCase());
      setSent(true);
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

          {sent ? (
            /* ── Success state ── */
            <View style={styles.successBlock}>
              <View style={[styles.iconBox, { backgroundColor: colors.incomeMuted, borderRadius: radii['2xl'] }]}>
                <ThemedText style={{ fontSize: 36 }}>✉️</ThemedText>
              </View>
              <ThemedText variant="h3" style={{ marginTop: spacing.xl, textAlign: 'center' }}>
                Check your inbox
              </ThemedText>
              <ThemedText
                variant="body"
                color={colors.textSecondary}
                style={{ marginTop: spacing.sm, textAlign: 'center', lineHeight: 22 }}
              >
                If an account exists for {email.trim()}, you'll receive a reset link shortly.{'\n'}
                In dev mode the token is printed to the server console.
              </ThemedText>
              <Button
                label="Enter Reset Token"
                variant="secondary"
                size="md"
                style={{ marginTop: spacing['3xl'] }}
                onPress={() => router.push('/auth/reset-password')}
              />
              <TouchableOpacity
                onPress={() => router.replace('/auth/login')}
                style={{ marginTop: spacing.xl }}
              >
                <ThemedText variant="body" color={colors.accent} semibold>Back to Sign In</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            /* ── Form state ── */
            <View>
              <ThemedText variant="h3">Forgot password?</ThemedText>
              <ThemedText
                variant="body"
                color={colors.textSecondary}
                style={{ marginTop: spacing.sm, marginBottom: spacing['3xl'], lineHeight: 22 }}
              >
                Enter the email address linked to your account and we'll send you a reset link.
              </ThemedText>

              <View style={{ gap: spacing.lg }}>
                <Input
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                {error ? (
                  <View style={[styles.errorBox, { backgroundColor: colors.expenseMuted, borderRadius: radii.md }]}>
                    <ThemedText variant="bodySm" color={colors.expense}>{error}</ThemedText>
                  </View>
                ) : null}

                <Button
                  label="Send Reset Link"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                  onPress={handleSubmit}
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
