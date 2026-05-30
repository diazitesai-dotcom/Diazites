import type { SupabaseClient } from "@supabase/supabase-js";

import { planMonthlyAmount } from "@/lib/billing/plans";
import { ok, fail, type ServiceResult } from "@/lib/result";
import { createBusinessRepository } from "@/repositories/business.repository";
import { createProfileRepository } from "@/repositories/profile.repository";
import type { BusinessUpsertInput } from "@/types/backend";
import type { BillingPlanName } from "@/types/backend";

import {
  applyPendingPromoOnBusinessCreate,
  resolveTrialDaysForUser,
  startPlatformTrial,
} from "@/services/billing/trial.service";

export async function getBusinessByUser(
  client: SupabaseClient,
  userId: string,
): Promise<ServiceResult<{ id: string } & Record<string, unknown>>> {
  const repo = createBusinessRepository(client);
  const { data, error } = await repo.getByOwnerUserId(userId);
  if (error) return fail(error.message);
  if (!data) return fail("No business for user", "NO_BUSINESS");
  return ok(data as { id: string } & Record<string, unknown>);
}

export async function createBusinessProfile(
  client: SupabaseClient,
  input: {
    ownerUserId: string;
    name: string;
    website?: string | null;
    serviceArea?: string | null;
    cityState?: string | null;
    services?: string | null;
    businessHours?: string | null;
    monthlyBudget?: number;
    logoUrl?: string | null;
    profileFullName?: string | null;
    profilePhone?: string | null;
    /** Default Growth trial plan */
    initialPlan?: { name: BillingPlanName; amount?: number };
    promoCode?: string | null;
  },
): Promise<ServiceResult<{ businessId: string }>> {
  const businesses = createBusinessRepository(client);
  const profiles = createProfileRepository(client);

  const { data: business, error: bErr } = await businesses.insert({
    ownerUserId: input.ownerUserId,
    name: input.name,
    website: input.website,
    serviceArea: input.serviceArea,
    cityState: input.cityState,
    services: input.services,
    businessHours: input.businessHours,
    monthlyBudget: input.monthlyBudget,
    logoUrl: input.logoUrl,
  });

  if (bErr || !business) {
    return fail(bErr?.message ?? "Business insert failed", "BUSINESS_CREATE_FAILED");
  }

  await profiles.upsert({
    userId: input.ownerUserId,
    businessId: business.id,
    fullName: input.profileFullName ?? null,
    phone: input.profilePhone ?? null,
    role: "owner",
  });

  const planName = input.initialPlan?.name ?? "Growth";
  const trialConfig = await resolveTrialDaysForUser(client, input.ownerUserId, input.promoCode);
  await applyPendingPromoOnBusinessCreate(client, input.ownerUserId, business.id);

  await startPlatformTrial(client, business.id, input.ownerUserId, {
    trialDays: trialConfig.trialDays,
    planName,
    promoCode: trialConfig.promoCode,
    promoSource: trialConfig.promoSource,
  });

  return ok({ businessId: business.id });
}

export async function updateBusinessProfile(
  client: SupabaseClient,
  businessId: string,
  ownerUserId: string,
  patch: BusinessUpsertInput,
): Promise<ServiceResult<unknown>> {
  const businesses = createBusinessRepository(client);
  const { data: existing } = await businesses.getById(businessId);
  if (!existing || existing.user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  const { data: updated, error } = await businesses.update(businessId, patch);
  if (error || !updated) return fail(error?.message ?? "Update failed");
  return ok(updated);
}
