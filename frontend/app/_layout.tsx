import { useEffect } from 'react';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/context/auth-context';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

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
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments]);

  // Handle notification tap — deep link into the relevant screen
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as Record<string, string>;
      if (!data?.screen) return;
      if (data.screen === 'group' && data.groupId) {
        router.push(`/group/${data.groupId}`);
      } else if (data.screen === 'subscription' && data.subscriptionId) {
        router.push(`/subscription/${data.subscriptionId}`);
      } else if (data.screen === 'reports') {
        router.push('/(tabs)/reports');
      }
    });
    return () => sub.remove();
  }, []);

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
      <Stack.Screen name="expense/add"         options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="expense/[id]"        options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="subscription/add"    options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="subscription/[id]"   options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="profile/index"       options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="group/create"      options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="group/[id]"        options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="group/invite"      options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="group/scan"        options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="group/add-expense" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="group/settle"      options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="join/[token]"      options={{ presentation: 'modal', animation: 'fade' }} />
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
