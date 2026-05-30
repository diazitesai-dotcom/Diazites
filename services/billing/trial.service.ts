import type { SupabaseClient } from "@supabase/supabase-js";

import { DEFAULT_TRIAL_DAYS, planMonthlyAmount } from "@/lib/billing/plans";
import { ok, fail, type ServiceResult } from "@/lib/result";
import { createBillingRepository } from "@/repositories/billing.repository";
import { createPromoCodeRepository } from "@/repositories/promo-code.repository";
import { EVENT_TYPES } from "@/types/backend";
import type { BillingPlanName } from "@/types/backend";

import { triggerEvent } from "@/services/events/event-dispatcher";
import { logAgentActivity } from "@/services/platform/agent-activity.service";

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export type TrialSnapshot = {
  trialStartedAt: string;
  trialEndsAt: string;
  daysRemaining: number;
  subscriptionStatus: string;
  promoCode: string | null;
  isExpired: boolean;
  isTrialing: boolean;
};

export function computeTrialSnapshot(billing: {
  trial_started_at?: string | null;
  trial_ends_at?: string | null;
  subscription_status?: string | null;
  payment_status?: string | null;
  promo_code?: string | null;
}): TrialSnapshot | null {
  if (!billing.trial_ends_at && billing.subscription_status !== "trialing") {
    return null;
  }

  const ends = billing.trial_ends_at ? new Date(billing.trial_ends_at) : null;
  const now = new Date();
  const daysRemaining = ends
    ? Math.max(0, Math.ceil((ends.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const status = billing.subscription_status ?? billing.payment_status ?? "trialing";

  return {
    trialStartedAt: billing.trial_started_at ?? now.toISOString(),
    trialEndsAt: billing.trial_ends_at ?? now.toISOString(),
    daysRemaining,
    subscriptionStatus: status,
    promoCode: billing.promo_code ?? null,
    isExpired: status === "expired" || (ends ? ends < now && status === "trialing" : false),
    isTrialing: status === "trialing",
  };
}

export async function startPlatformTrial(
  client: SupabaseClient,
  businessId: string,
  ownerUserId: string,
  options?: {
    trialDays?: number;
    planName?: BillingPlanName;
    promoCode?: string | null;
    promoSource?: string | null;
  },
): Promise<ServiceResult<TrialSnapshot>> {
  const days = options?.trialDays ?? DEFAULT_TRIAL_DAYS;
  const planName = options?.planName ?? "Growth";
  const started = new Date();
  const ends = addDays(started, days);

  const billing = createBillingRepository(client);
  const { data, error } = await billing.upsertPlan({
    businessId,
    planName,
    amount: planMonthlyAmount(planName),
    paymentStatus: "trialing",
    subscriptionStatus: "trialing",
    trialStartedAt: started.toISOString(),
    trialEndsAt: ends.toISOString(),
    promoCode: options?.promoCode ?? null,
    promoSource: options?.promoSource ?? null,
  });

  if (error || !data) return fail(error?.message ?? "Failed to start trial");

  await triggerEvent(client, {
    type: EVENT_TYPES.TRIAL_STARTED,
    businessId,
    payload: { trialDays: days, planName, promoCode: options?.promoCode },
  });

  await logAgentActivity(client, {
    businessId,
    agentKey: "billing",
    actionType: "trial_started",
    entityType: "billing",
    payload: {
      trialDays: days,
      message: `${days}-day trial activated${options?.promoCode ? ` with code ${options.promoCode}` : ""}.`,
    },
  });

  const snapshot = computeTrialSnapshot(data);
  if (!snapshot) return fail("Trial snapshot unavailable");

  return ok(snapshot);
}

export async function resolveTrialDaysForUser(
  client: SupabaseClient,
  userId: string,
  explicitPromoCode?: string | null,
): Promise<{ trialDays: number; promoCode: string | null; promoSource: string | null }> {
  const promos = createPromoCodeRepository(client);

  if (explicitPromoCode?.trim()) {
    const { data: row } = await promos.getByCode(explicitPromoCode.trim());
    if (row) {
      return {
        trialDays: row.trial_days,
        promoCode: row.code,
        promoSource: row.source,
      };
    }
  }

  const { data: pending } = await promos.getPendingSignupPromo(userId);
  if (pending) {
    return {
      trialDays: pending.trial_days,
      promoCode: pending.promo_code,
      promoSource: "signup",
    };
  }

  return { trialDays: DEFAULT_TRIAL_DAYS, promoCode: null, promoSource: null };
}

export async function applyPendingPromoOnBusinessCreate(
  client: SupabaseClient,
  userId: string,
  businessId: string,
): Promise<void> {
  const promos = createPromoCodeRepository(client);
  const { data: pending } = await promos.getPendingSignupPromo(userId);
  if (!pending) return;

  const { data: promo } = await promos.getByCode(pending.promo_code);
  if (promo) {
    await promos.recordRedemption({
      promoCodeId: promo.id,
      userId,
      businessId,
      trialDaysGranted: pending.trial_days,
    });
    await promos.incrementUseCount(promo.id, promo.use_count);
  }

  await promos.clearPendingSignupPromo(userId);

  await triggerEvent(client, {
    type: EVENT_TYPES.PROMO_REDEEMED,
    businessId,
    payload: { promoCode: pending.promo_code, trialDays: pending.trial_days },
  });
}
