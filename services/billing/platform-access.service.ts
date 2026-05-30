import type { SupabaseClient } from "@supabase/supabase-js";

import { computeTrialSnapshot } from "@/services/billing/trial.service";
import { createBillingRepository } from "@/repositories/billing.repository";
import { createBusinessRepository } from "@/repositories/business.repository";

export type PlatformAccess = {
  hasAccess: boolean;
  reason: string;
  subscriptionStatus: string;
  trial: ReturnType<typeof computeTrialSnapshot>;
  shouldShowUpgrade: boolean;
  isSoftPaywall: boolean;
};

export async function getPlatformAccess(
  client: SupabaseClient,
  userId: string,
): Promise<PlatformAccess> {
  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getByOwnerUserId(userId);

  if (!business) {
    return {
      hasAccess: true,
      reason: "onboarding",
      subscriptionStatus: "trialing",
      trial: null,
      shouldShowUpgrade: false,
      isSoftPaywall: false,
    };
  }

  const billing = createBillingRepository(client);
  const { data: row } = await billing.getByBusinessId(business.id);
  if (!row) {
    return {
      hasAccess: true,
      reason: "no_billing_row",
      subscriptionStatus: "trialing",
      trial: null,
      shouldShowUpgrade: false,
      isSoftPaywall: false,
    };
  }

  const trial = computeTrialSnapshot(row);
  const status = row.subscription_status ?? row.payment_status ?? "trialing";

  if (status === "active") {
    return {
      hasAccess: true,
      reason: "paid",
      subscriptionStatus: status,
      trial,
      shouldShowUpgrade: false,
      isSoftPaywall: false,
    };
  }

  if (status === "trialing" && trial && !trial.isExpired) {
    return {
      hasAccess: true,
      reason: "trial",
      subscriptionStatus: status,
      trial,
      shouldShowUpgrade: trial.daysRemaining <= 3,
      isSoftPaywall: trial.daysRemaining <= 7,
    };
  }

  if (status === "past_due" || status === "unpaid") {
    return {
      hasAccess: true,
      reason: "past_due_grace",
      subscriptionStatus: status,
      trial,
      shouldShowUpgrade: true,
      isSoftPaywall: true,
    };
  }

  return {
    hasAccess: false,
    reason: "expired",
    subscriptionStatus: status,
    trial,
    shouldShowUpgrade: true,
    isSoftPaywall: true,
  };
}
