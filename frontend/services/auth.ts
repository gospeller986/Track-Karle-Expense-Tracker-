/**
 * Auth API service — typed wrappers around each auth endpoint.
 */

import { apiFetch } from './api';

// ── Types ──────────────────────────────────────────────────────────────────

// Only the minimal user shape returned by register/login.
// Full profile is fetched separately via GET /users/me (UserProfile type).
type AuthUser = { id: string; name: string; email: string; currency: string };

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

// ── API calls ──────────────────────────────────────────────────────────────

export function register(
  name: string,
  email: string,
  password: string,
  currency = 'INR',
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, currency }),
  });
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function refresh(refresh_token: string): Promise<RefreshResponse> {
  return apiFetch<RefreshResponse>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token }),
  });
}

export function logout(refresh_token: string): Promise<void> {
  return apiFetch<void>('/auth/logout', {
    method: 'POST',
    auth: true,
    body: JSON.stringify({ refresh_token }),
  });
}

export function forgotPassword(email: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(
  token: string,
  newPassword: string,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  });
}
