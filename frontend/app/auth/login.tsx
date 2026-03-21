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

export default function LoginScreen() {
  const { colors, spacing, radii } = useTheme();
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      // AuthProvider sets user → root layout redirects to (tabs)
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else {
        console.error('[Login error]', e);
        setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
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

          {/* Logo / Brand */}
          <View style={styles.brand}>
            <View style={[styles.logoBox, { backgroundColor: colors.accent, borderRadius: radii.xl }]}>
              <ThemedText variant="h2" color={colors.textOnAccent}>₹</ThemedText>
            </View>
            <ThemedText variant="h3" style={{ marginTop: spacing.lg }}>Welcome back</ThemedText>
            <ThemedText variant="body" color={colors.textSecondary} style={{ marginTop: spacing.xs }}>
              Sign in to your account
            </ThemedText>
          </View>

          {/* Form */}
          <View style={[styles.form, { gap: spacing.lg }]}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
            />

            {/* Forgot password link */}
            <TouchableOpacity
              onPress={() => router.push('/auth/forgot-password')}
              style={{ alignSelf: 'flex-end' }}
            >
              <ThemedText variant="label" color={colors.accent}>Forgot password?</ThemedText>
            </TouchableOpacity>

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: colors.expenseMuted, borderRadius: radii.md }]}>
                <ThemedText variant="bodySm" color={colors.expense}>{error}</ThemedText>
              </View>
            ) : null}

            <Button
              label="Sign In"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              onPress={handleLogin}
            />
          </View>

          {/* Register link */}
          <View style={styles.footer}>
            <ThemedText variant="body" color={colors.textSecondary}>Don't have an account? </ThemedText>
            <TouchableOpacity onPress={() => router.push('/auth/register')}>
              <ThemedText variant="body" color={colors.accent} semibold>Sign up</ThemedText>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll:  { flexGrow: 1, justifyContent: 'center', paddingVertical: 40 },
  brand:   { alignItems: 'center', marginBottom: 40 },
  logoBox: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  form:    { gap: 16 },
  errorBox:{ padding: 12 },
  footer:  { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
});
