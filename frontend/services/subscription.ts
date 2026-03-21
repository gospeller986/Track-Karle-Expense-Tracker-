import { apiFetch } from './api';
import type {
  CreateSubscriptionPayload,
  Subscription,
  SubscriptionListResponse,
  UpdateSubscriptionPayload,
} from '@/interfaces/subscription';

export type { Subscription, SubscriptionListResponse };

export function listSubscriptions(): Promise<SubscriptionListResponse> {
  return apiFetch<SubscriptionListResponse>('/subscriptions', { auth: true });
}

export function createSubscription(payload: CreateSubscriptionPayload): Promise<Subscription> {
  return apiFetch<Subscription>('/subscriptions', {
    method: 'POST',
    auth: true,
    body: JSON.stringify(payload),
  });
}

export function getSubscription(id: string): Promise<Subscription> {
  return apiFetch<Subscription>(`/subscriptions/${id}`, { auth: true });
}

export function updateSubscription(
  id: string,
  payload: UpdateSubscriptionPayload,
): Promise<Subscription> {
  return apiFetch<Subscription>(`/subscriptions/${id}`, {
    method: 'PUT',
    auth: true,
    body: JSON.stringify(payload),
  });
}

export function deleteSubscription(id: string): Promise<void> {
  return apiFetch<void>(`/subscriptions/${id}`, { method: 'DELETE', auth: true });
}
