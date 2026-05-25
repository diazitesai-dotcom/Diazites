import type { SupabaseClient } from "@supabase/supabase-js";

import { ok, fail, type ServiceResult } from "@/lib/result";
import { createOnboardingRepository } from "@/repositories/onboarding.repository";
import { createBusinessRepository } from "@/repositories/business.repository";
import { createBusinessProfile } from "@/services/business/business.service";
import { seedDefaultTasksIfEmpty } from "@/services/tasks/task.service";
import { EVENT_TYPES } from "@/types/backend";
import type { BusinessProfile, OnboardingWizardPayload } from "@/types/platform-growth";

import { triggerEvent } from "@/services/events/event-dispatcher";

function toBusinessProfile(form: OnboardingWizardPayload): BusinessProfile {
  return {
    industry: form.industry,
    businessType: form.businessType,
    businessEmail: form.businessEmail,
    businessAddress: form.businessAddress,
    serviceAreas: form.serviceArea,
    mainServices: form.mainServices ?? form.services,
    targetAudience: form.targetAudience,
    idealCustomer: form.idealCustomer,
    offerPromotion: form.offerPromotion,
    campaignGoal: form.campaignGoal,
    brandTone: form.brandTone,
    brandColors: form.brandColors,
    existingCrm: form.existingCrm,
    existingWebsite: form.existingWebsite,
    leadNotifyEmail: form.leadNotifyEmail,
    leadNotifyPhone: form.leadNotifyPhone,
  };
}

/**
 * Persists onboarding answers, provisions business + billing, advances stage to `live`.
 */
export async function completeOnboardingProfile(
  client: SupabaseClient,
  userId: string,
  form: OnboardingWizardPayload,
): Promise<ServiceResult<{ businessId: string }>> {
  const onboarding = createOnboardingRepository(client);
  const profile = toBusinessProfile(form);

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
  const businesses = createBusinessRepository(client);
  await businesses.updateProfile(businessId, profile);

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
    profileData: profile as Record<string, unknown>,
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

  try {
    await seedDefaultTasksIfEmpty(client, businessId);
  } catch {
    /* tasks table may not exist until migration 016 is applied */
  }

  await triggerEvent(client, {
    type: EVENT_TYPES.ONBOARDING_STAGE_CHANGED,
    businessId,
    payload: { stage: "live", campaignGoal: form.campaignGoal },
  });

  return ok({ businessId });
}
