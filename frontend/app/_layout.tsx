import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import * as Notifications from 'expo-notifications';

import { AuthProvider, useAuth } from '@/context/auth-context';
import { AppThemeProvider } from '@/context/theme-context';
import { useTheme } from '@/hooks/use-theme';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ── Inner root — can safely read theme + auth context ──────────────────────

function AppRoot() {
  const { user, isLoading } = useAuth();
  const { isDark, colors }  = useTheme();
  const segments = useSegments();
  const router   = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === 'auth';
    if (!user && !inAuthGroup)  router.replace('/auth/login');
    else if (user && inAuthGroup) router.replace('/(tabs)');
  }, [user, isLoading, segments]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as Record<string, string>;
      if (!data?.screen) return;
      if (data.screen === 'group' && data.groupId)
        router.push(`/group/${data.groupId}`);
      else if (data.screen === 'subscription' && data.subscriptionId)
        router.push(`/subscription/${data.subscriptionId}`);
      else if (data.screen === 'reports')
        router.push('/(tabs)/reports');
    });
    return () => sub.remove();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="expense/add"         options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="expense/[id]"        options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="subscription/add"    options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="subscription/[id]"   options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="profile/index"       options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="group/create"        options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="group/[id]"          options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="group/invite"        options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="group/scan"          options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="group/add-expense"   options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="group/settle"        options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="join/[token]"        options={{ presentation: 'modal', animation: 'fade' }} />
        <Stack.Screen name="modal"               options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

// ── Root layout ────────────────────────────────────────────────────────────

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <AuthProvider>
        <AppRoot />
      </AuthProvider>
    </AppThemeProvider>
  );
}
