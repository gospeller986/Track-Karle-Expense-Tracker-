export interface NotificationPreferences {
  groupExpenseAdded: boolean;
  settlementCreated: boolean;
  groupInvite: boolean;
  subscriptionReminders: boolean;
  budgetAlerts: boolean;
}

export interface RegisterDevicePayload {
  token: string;
  platform: 'ios' | 'android';
  deviceName?: string;
}

export interface UpdatePreferencesPayload {
  groupExpenseAdded?: boolean;
  settlementCreated?: boolean;
  groupInvite?: boolean;
  subscriptionReminders?: boolean;
  budgetAlerts?: boolean;
}
