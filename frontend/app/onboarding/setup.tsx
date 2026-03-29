import { useState } from 'react';
import {
  ScrollView, View, TouchableOpacity, StyleSheet,
  StatusBar, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as SecureStore from 'expo-secure-store';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth-context';
import { ONBOARDING_KEY } from './index';

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'];

export default function OnboardingSetupScreen() {
  const { colors, spacing, radii, shadows } = useTheme();
  const router = useRouter();
  const { updateProfile } = useAuth();

  const [currency, setCurrency] = useState('INR');
  const [budget, setBudget] = useState('');
  const [loading, setLoading] = useState(false);

  const finish = async () => {
    setLoading(true);
    try {
      const payload: { currency: string; monthlyBudget?: number } = { currency };
      const parsed = parseFloat(budget);
      if (!isNaN(parsed) && parsed > 0) payload.monthlyBudget = parsed;
      await updateProfile(payload);
    } catch {
      // Non-blocking — user can update in profile later
    }
    await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
    router.replace('/(tabs)');
    setLoading(false);
  };

  const skip = async () => {
    await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: spacing.xl, paddingBottom: spacing['4xl'] }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top accent bar */}
        <View style={[styles.accentBar, { backgroundColor: colors.accentMuted, borderRadius: radii.full }]} />

        {/* Hero text */}
        <View style={{ marginTop: spacing['3xl'], marginBottom: spacing['4xl'], gap: spacing.sm }}>
          <ThemedText style={{ fontSize: 32, fontWeight: '800', color: colors.textPrimary , paddingTop: spacing['2xl']}}>
            You're almost in!
          </ThemedText>
          <ThemedText variant="body" color={colors.textSecondary} style={{ lineHeight: 22 }}>
            Quick setup — you can always change these later in your Profile.
          </ThemedText>
        </View>

        {/* Currency section */}
        <View style={{ marginBottom: spacing['3xl'] }}>
          <View style={[styles.sectionHeader, { marginBottom: spacing.md }]}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.accentMuted, borderRadius: radii.md }]}>
              <Ionicons name="swap-horizontal-outline" size={18} color={colors.accent} />
            </View>
            <View>
              <ThemedText variant="bodySm" semibold>Currency</ThemedText>
              <ThemedText variant="caption" color={colors.textSecondary}>Used across all expenses and reports</ThemedText>
            </View>
          </View>
          <View style={styles.currencyGrid}>
            {CURRENCIES.map(c => (
              <TouchableOpacity
                key={c}
                onPress={() => setCurrency(c)}
                style={[
                  styles.currencyChip,
                  {
                    borderRadius: radii.lg,
                    borderWidth: 1.5,
                    borderColor: currency === c ? colors.accent : colors.border,
                    backgroundColor: currency === c ? colors.accentMuted : colors.surface,
                  },
                ]}
              >
                <ThemedText
                  variant="bodySm"
                  semibold={currency === c}
                  color={currency === c ? colors.accent : colors.textSecondary}
                >
                  {c}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Monthly budget section */}
        <View style={{ marginBottom: spacing['4xl'] }}>
          <View style={[styles.sectionHeader, { marginBottom: spacing.md }]}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.accentMuted, borderRadius: radii.md }]}>
              <Ionicons name="wallet-outline" size={18} color={colors.accent} />
            </View>
            <View>
              <ThemedText variant="bodySm" semibold>Monthly Budget</ThemedText>
              <ThemedText variant="caption" color={colors.textSecondary}>Optional — get alerts when you're close</ThemedText>
            </View>
          </View>
          <Input
            label={`Amount (${currency})`}
            value={budget}
            onChangeText={setBudget}
            keyboardType="decimal-pad"
            placeholder="e.g. 40000"
          />
        </View>

        {/* CTAs */}
        <View style={{ gap: spacing.md }}>
          <Button
            label="Let's Go"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            onPress={finish}
            style={shadows.accent}
          />
          <TouchableOpacity onPress={skip} style={{ alignItems: 'center', paddingVertical: spacing.md }}>
            <ThemedText variant="bodySm" color={colors.textTertiary}>Skip for now</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  accentBar:    { height: 4, width: 48, marginTop: 20 },
  sectionHeader:{ flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionIcon:  { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  currencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  currencyChip: { paddingHorizontal: 18, paddingVertical: 10 },
});
