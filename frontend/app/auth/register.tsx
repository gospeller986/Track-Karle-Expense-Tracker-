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

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'];

export default function RegisterScreen() {
  const { colors, spacing, radii } = useTheme();
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(name.trim(), email.trim().toLowerCase(), password, currency);
      // AuthProvider sets user → root layout redirects to (tabs)
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else {
        console.error('[Register error]', e);
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

          {/* Brand */}
          <View style={styles.brand}>
            <View style={[styles.logoBox, { backgroundColor: colors.accent, borderRadius: radii.xl }]}>
              <ThemedText variant="h2" color={colors.textOnAccent}>₹</ThemedText>
            </View>
            <ThemedText variant="h3" style={{ marginTop: spacing.lg }}>Create account</ThemedText>
            <ThemedText variant="body" color={colors.textSecondary} style={{ marginTop: spacing.xs }}>
              Start tracking your expenses
            </ThemedText>
          </View>

          {/* Form */}
          <View style={{ gap: spacing.lg }}>
            <Input
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="John Doe"
              autoCapitalize="words"
            />

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
              placeholder="At least 8 characters"
              secureTextEntry
            />

            {/* Currency picker */}
            <View>
              <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.sm }}>
                Currency
              </ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  {CURRENCIES.map(c => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setCurrency(c)}
                      style={[
                        styles.currencyChip,
                        {
                          borderRadius: radii.full,
                          borderWidth: 1,
                          backgroundColor: currency === c ? colors.accentMuted : colors.surface,
                          borderColor:     currency === c ? colors.accent       : colors.border,
                          paddingHorizontal: spacing.md,
                          paddingVertical:   spacing.sm,
                        },
                      ]}
                    >
                      <ThemedText
                        variant="label"
                        color={currency === c ? colors.accent : colors.textSecondary}
                      >
                        {c}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: colors.expenseMuted, borderRadius: radii.md }]}>
                <ThemedText variant="bodySm" color={colors.expense}>{error}</ThemedText>
              </View>
            ) : null}

            <Button
              label="Create Account"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              onPress={handleRegister}
            />
          </View>

          {/* Login link */}
          <View style={styles.footer}>
            <ThemedText variant="body" color={colors.textSecondary}>Already have an account? </ThemedText>
            <TouchableOpacity onPress={() => router.back()}>
              <ThemedText variant="body" color={colors.accent} semibold>Sign in</ThemedText>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll:       { flexGrow: 1, justifyContent: 'center', paddingVertical: 40 },
  brand:        { alignItems: 'center', marginBottom: 40 },
  logoBox:      { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  currencyChip: {},
  errorBox:     { padding: 12 },
  footer:       { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
});
