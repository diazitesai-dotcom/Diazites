import type { SupabaseClient } from "@supabase/supabase-js";

import { ok, fail, type ServiceResult } from "@/lib/result";
import { createOnboardingRepository } from "@/repositories/onboarding.repository";
import { createBusinessProfile } from "@/services/business/business.service";
import { EVENT_TYPES } from "@/types/backend";

import { triggerEvent } from "@/services/events/event-dispatcher";

export type OnboardingFormPayload = {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  website: string;
  serviceArea: string;
  cityState: string;
  services: string;
  businessHours: string;
  monthlyBudget: number;
};

/**
 * Persists onboarding answers, provisions business + billing, advances stage to `live`.
 */
export async function completeOnboardingProfile(
  client: SupabaseClient,
  userId: string,
  form: OnboardingFormPayload,
): Promise<ServiceResult<{ businessId: string }>> {
  const onboarding = createOnboardingRepository(client);

  const businessResult = await createBusinessProfile(client, {
    ownerUserId: userId,
    name: form.businessName,
    website: form.website || null,
    serviceArea: form.serviceArea || null,
    cityState: form.cityState || null,
    services: form.services || null,
    businessHours: form.businessHours || null,
    monthlyBudget: form.monthlyBudget,
    profileFullName: form.ownerName || null,
    profilePhone: form.phone || null,
    initialPlan: { name: "Growth", amount: 997 },
  });

  if (!businessResult.success) {
    return businessResult;
  }

  const businessId = businessResult.data.businessId;

  await onboarding.upsertFull({
    userId,
    businessName: form.businessName,
    ownerName: form.ownerName,
    email: form.email,
    phone: form.phone,
    website: form.website,
    serviceArea: form.serviceArea,
    cityState: form.cityState,
    services: form.services,
    businessHours: form.businessHours,
    monthlyBudget: form.monthlyBudget,
    stage: "live",
    status: "completed",
    checklist: {
      profile_complete: true,
      agents_assigned: false,
      campaign_built: false,
      landing_page_ready: false,
      ai_active: false,
    },
  });

  await triggerEvent(client, {
    type: EVENT_TYPES.ONBOARDING_STAGE_CHANGED,
    businessId,
    payload: { stage: "live" },
  });

  return ok({ businessId });
}
