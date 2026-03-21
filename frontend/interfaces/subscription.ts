import type { BillingCycle } from '@/types/subscription';

export interface Subscription {
  id: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
  cycle: BillingCycle;      // backend field billing_cycle aliased as "cycle"
  nextRenewal: string;      // ISO date e.g. "2026-04-01"
  category: string;
  isActive: boolean;
  createdAt: string;
}

export interface SubscriptionSummary {
  monthlyTotal: number;
  yearlyTotal: number;
  count: number;
}

export interface SubscriptionListResponse {
  data: Subscription[];
  summary: SubscriptionSummary;
}

export interface CreateSubscriptionPayload {
  name: string;
  icon: string;
  color: string;
  amount: number;
  cycle: BillingCycle;
  nextRenewal: string;
  category: string;
}

export interface UpdateSubscriptionPayload {
  name?: string;
  icon?: string;
  color?: string;
  amount?: number;
  cycle?: BillingCycle;
  nextRenewal?: string;
  category?: string;
  isActive?: boolean;
}
