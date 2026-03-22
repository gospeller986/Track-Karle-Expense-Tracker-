import { useCallback, useEffect, useState } from 'react';
import * as notificationApi from '@/services/notification';
import type { NotificationPreferences, UpdatePreferencesPayload } from '@/interfaces/notification';

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const prefs = await notificationApi.getPreferences();
        setPreferences(prefs);
      } catch {
        // Silently fail — preferences are non-critical
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const updatePreferences = useCallback(async (payload: UpdatePreferencesPayload) => {
    setIsSaving(true);
    try {
      const updated = await notificationApi.updatePreferences(payload);
      setPreferences(updated);
    } finally {
      setIsSaving(false);
    }
  }, []);

  return { preferences, isLoading, isSaving, updatePreferences };
}
