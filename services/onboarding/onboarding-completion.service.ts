import type { SupabaseClient } from "@supabase/supabase-js";

import { ok, fail, type ServiceResult } from "@/lib/result";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { registerAgencyAccount } from "@/services/admin/platform-accounts.service";
import { createOnboardingRepository } from "@/repositories/onboarding.repository";
import { createBusinessRepository } from "@/repositories/business.repository";
import { createBusinessProfile } from "@/services/business/business.service";
import { seedDefaultTasksIfEmpty } from "@/services/tasks/task.service";
import { EVENT_TYPES } from "@/types/backend";
import type { BusinessProfile, OnboardingWizardPayload } from "@/types/platform-growth";

import { bootstrapBusinessSystem } from "@/services/platform/bootstrap-business-system.service";
import { logAgentActivity } from "@/services/platform/agent-activity.service";
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
    initialPlan: { name: "Starter" },
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
    profileData: {
      ...profile,
      accountIntent: form.accountIntent ?? "direct",
    } as Record<string, unknown>,
    stage: "live",
    status: "completed",
    checklist: {
      profile_complete: true,
      integrations_connected: false,
      agents_assigned: false,
      campaign_built: false,
      landing_page_ready: false,
      ai_active: false,
      team_invited: false,
    },
  });

  if (form.accountIntent === "agency") {
    try {
      const service = createServiceRoleClient();
      await registerAgencyAccount(service, userId, {
        businessId,
        agencyName: form.businessName,
      });
    } catch {
      /* agency row is best-effort; admin can fix from Platform accounts */
    }
  }

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

  const systemGoal =
    form.campaignGoal?.trim() ||
    `Grow ${form.businessName} with CRM, follow-up, and appointment booking.`;
  try {
    await bootstrapBusinessSystem(client, userId, businessId, systemGoal);
    await logAgentActivity(client, {
      businessId,
      agentKey: "workflow",
      actionType: "business_system_generated",
      payload: { message: "Workflow Agent launched onboarding automations." },
    });
  } catch {
    /* bootstrap is best-effort during onboarding */
  }

  return ok({ businessId });
}
