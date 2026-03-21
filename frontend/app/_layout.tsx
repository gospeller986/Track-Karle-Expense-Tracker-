import { useEffect } from 'react';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/context/auth-context';

// ── Protected routing ──────────────────────────────────────────────────────
// Runs inside AuthProvider so it can read auth state.

function RootNavigator() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router   = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup) {
      // Not logged in — send to login
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      // Already logged in — send to app
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0D0D0D', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#C9F31D" size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0D0D0D' } }}>
      {/* Auth group */}
      <Stack.Screen name="auth" />

      {/* App group */}
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="expense/add"         options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="expense/[id]"        options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="subscription/add"    options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="subscription/[id]"   options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="profile/index"       options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="group/create"      options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="group/add-members" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="group/[id]"        options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="group/add-expense" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="modal"             options={{ presentation: 'modal' }} />
    </Stack>
  );
}

// ── Root layout ────────────────────────────────────────────────────────────

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider value={DarkTheme}>
        <RootNavigator />
        <StatusBar style="light" />
      </ThemeProvider>
    </AuthProvider>
  );
}
