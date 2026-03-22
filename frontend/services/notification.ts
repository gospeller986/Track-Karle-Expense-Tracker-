import { apiFetch } from './api';
import type { NotificationPreferences, RegisterDevicePayload, UpdatePreferencesPayload } from '@/interfaces/notification';

export async function registerDevice(payload: RegisterDevicePayload): Promise<void> {
  await apiFetch('/notifications/register-device', {
    method: 'POST',
    auth: true,
    body: JSON.stringify(payload),
  });
}

export async function getPreferences(): Promise<NotificationPreferences> {
  return apiFetch<NotificationPreferences>('/notifications/preferences', { auth: true });
}

export async function updatePreferences(payload: UpdatePreferencesPayload): Promise<NotificationPreferences> {
  return apiFetch<NotificationPreferences>('/notifications/preferences', {
    method: 'PUT',
    auth: true,
    body: JSON.stringify(payload),
  });
}
