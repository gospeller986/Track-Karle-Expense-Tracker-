/**
 * Base API client.
 * Derives the backend host from Expo's hostUri at runtime so the IP never
 * needs to be hardcoded — works automatically on any network/device.
 */

import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

function getApiBase(): string {
  // In Expo Go / dev builds, hostUri is the Metro bundler host (e.g. "192.168.1.3:8081").
  // Strip the port and replace with the backend port.
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0]; // e.g. "192.168.1.3"
    return `http://${host}:8000/api/v1`;
  }
  // Fallback for production builds or simulators
  return process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1';
}

export const API_BASE = getApiBase();

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

async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync('access_token');
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

  const res = await fetch(`${API_BASE}${path}`, { headers, ...rest });

  if (res.status === 204) return undefined as T;

  const json = await res.json();

  if (!res.ok) {
    const detail = json?.detail ?? {};
    const code = typeof detail === 'object' ? (detail.code ?? 'ERROR') : 'ERROR';
    const message =
      typeof detail === 'object' ? (detail.message ?? res.statusText) : String(detail);
    throw new ApiError(res.status, code, message);
  }

  return json as T;
}
