import { apiFetch } from './api';

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  currency: string;
  monthlyBudget: number | null;
  notificationsEnabled: boolean;
  theme: string;
  createdAt: string;
};

export type UpdateProfilePayload = {
  name?: string;
  currency?: string;
  monthlyBudget?: number | null;
  notificationsEnabled?: boolean;
  theme?: string;
};

export function getMe(): Promise<UserProfile> {
  return apiFetch<UserProfile>('/users/me', { auth: true });
}

export function updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
  return apiFetch<UserProfile>('/users/me', {
    method: 'PUT',
    auth: true,
    body: JSON.stringify(payload),
  });
}

export function deleteAccount(): Promise<void> {
  return apiFetch<void>('/users/me', { method: 'DELETE', auth: true });
}

/** Compute 1-2 letter initials from a display name. */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
