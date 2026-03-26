/**
 * Base API client.
 * Derives the backend host from Expo's hostUri at runtime so the IP never
 * needs to be hardcoded — works automatically on any network/device.
 */

import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

function getApiBase(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  // If explicitly configured to a non-localhost URL (deployed backend),
  // always use it — even in Expo Go dev mode.
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl;
  }

  // In Expo Go / dev builds with local backend, derive host from Metro bundler.
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0]; // e.g. "192.168.1.3"
    return `http://${host}:8000/api/v1`;
  }

  return envUrl ?? 'http://localhost:8000/api/v1';
}

export const API_BASE = getApiBase();
console.log('[API] base URL:', API_BASE);

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ── Token refresh logic ────────────────────────────────────────────────────
// Prevents multiple concurrent refresh calls — all 401s queue up and resolve
// together once the single refresh completes.

const KEYS = { access: 'access_token', refresh: 'refresh_token' } as const;

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

async function runTokenRefresh(): Promise<string | null> {
  const storedRefresh = await SecureStore.getItemAsync(KEYS.refresh);
  if (!storedRefresh) return null;

  // Import lazily to avoid circular dependency (auth.ts → api.ts → auth.ts)
  const { refresh } = await import('./auth');
  const { accessToken, refreshToken } = await refresh(storedRefresh);

  await Promise.all([
    SecureStore.setItemAsync(KEYS.access, accessToken),
    SecureStore.setItemAsync(KEYS.refresh, refreshToken),
  ]);

  return accessToken;
}

async function refreshAccessToken(): Promise<string | null> {
  if (isRefreshing) {
    // Another request is already refreshing — wait for it
    return new Promise(resolve => { refreshQueue.push(resolve); });
  }

  isRefreshing = true;
  try {
    const newToken = await runTokenRefresh();
    refreshQueue.forEach(resolve => resolve(newToken));
    return newToken;
  } catch {
    refreshQueue.forEach(resolve => resolve(null));
    // Clear tokens — force re-login
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.access),
      SecureStore.deleteItemAsync(KEYS.refresh),
    ]);
    return null;
  } finally {
    isRefreshing = false;
    refreshQueue = [];
  }
}

async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.access);
}

// ── Core fetch ────────────────────────────────────────────────────────────

async function doFetch(path: string, headers: Record<string, string>, rest: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, { headers, ...rest });
  if (res.status === 204) return { res, json: undefined };
  const json = await res.json();
  return { res, json };
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth = false, headers: extraHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extraHeaders as Record<string, string>),
  };

  if (auth) {
    const token = await getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  let { res, json } = await doFetch(path, headers, rest);

  // Auto-refresh on 401 and retry once
  if (auth && res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      ({ res, json } = await doFetch(path, headers, rest));
    }
  }

  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    const detail = json?.detail ?? {};
    const code = typeof detail === 'object' ? (detail.code ?? 'ERROR') : 'ERROR';
    const message =
      typeof detail === 'object' ? (detail.message ?? res.statusText) : String(detail);
    throw new ApiError(res.status, code, message);
  }

  return json as T;
}
