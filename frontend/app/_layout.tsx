import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

export default function RootLayout() {
  // Force dark theme — to enable system-based switching later,
  // replace DarkTheme with: colorScheme === 'dark' ? DarkTheme : DefaultTheme
  return (
    <ThemeProvider value={DarkTheme}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0D0D0D' } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="expense/add"  options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="expense/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="profile/index"     options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="group/create"      options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="group/add-members" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="group/[id]"        options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="group/add-expense" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
