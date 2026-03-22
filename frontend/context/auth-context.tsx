/**
 * Auth context — manages user session and persists tokens to SecureStore.
 *
 * Wrap the app root with <AuthProvider>. Consume with useAuth().
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as authApi from '@/services/auth';
import * as userApi from '@/services/user';
import { registerDevice } from '@/services/notification';
import type { UserProfile, UpdateProfilePayload } from '@/services/user';

// ── Types ──────────────────────────────────────────────────────────────────

type AuthContextValue = {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, currency?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Push token registration ────────────────────────────────────────────────

async function registerPushToken(): Promise<void> {
  try {
    if (!Device.isDevice) return; // simulators don't support push
    const { status: existing } = await Notifications.getPermissionsAsync();
    const finalStatus = existing !== 'granted'
      ? (await Notifications.requestPermissionsAsync()).status
      : existing;
    if (finalStatus !== 'granted') return;

    const { data: token } = await Notifications.getExpoPushTokenAsync();
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    await registerDevice({ token, platform });
  } catch {
    // Non-critical — never block the auth flow
  }
}

// ── Token storage helpers ──────────────────────────────────────────────────

const KEYS = { access: 'access_token', refresh: 'refresh_token' } as const;

async function storeTokens(access: string, refresh: string) {
  await Promise.all([
    SecureStore.setItemAsync(KEYS.access, access),
    SecureStore.setItemAsync(KEYS.refresh, refresh),
  ]);
}

async function clearTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.access),
    SecureStore.deleteItemAsync(KEYS.refresh),
  ]);
}

// ── Provider ──────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: restore session from stored refresh token, then fetch full profile
  useEffect(() => {
    (async () => {
      try {
        const storedRefresh = await SecureStore.getItemAsync(KEYS.refresh);
        if (!storedRefresh) return;

        const { accessToken, refreshToken } = await authApi.refresh(storedRefresh);
        await storeTokens(accessToken, refreshToken);

        // Fetch full profile now that we have a valid access token
        const profile = await userApi.getMe();
        setUser(profile);
        registerPushToken();
      } catch {
        // Refresh failed — clear everything, force re-login
        await clearTokens();
        await SecureStore.deleteItemAsync('user');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const { accessToken, refreshToken } = await authApi.login(email, password);
    await storeTokens(accessToken, refreshToken);
    const profile = await userApi.getMe();
    setUser(profile);
    registerPushToken();
  };

  const register = async (name: string, email: string, password: string, currency = 'INR') => {
    const { accessToken, refreshToken } = await authApi.register(name, email, password, currency);
    await storeTokens(accessToken, refreshToken);
    const profile = await userApi.getMe();
    setUser(profile);
    registerPushToken();
  };

  const logout = async () => {
    try {
      const storedRefresh = await SecureStore.getItemAsync(KEYS.refresh);
      if (storedRefresh) await authApi.logout(storedRefresh);
    } catch {
      // Best-effort server revoke; always clear local state
    } finally {
      await clearTokens();
      setUser(null);
    }
  };

  const updateProfile = async (payload: UpdateProfilePayload) => {
    const updated = await userApi.updateProfile(payload);
    setUser(updated);
  };

  const forgotPassword = async (email: string) => {
    await authApi.forgotPassword(email);
  };

  const resetPassword = async (token: string, newPassword: string) => {
    await authApi.resetPassword(token, newPassword);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateProfile, forgotPassword, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
