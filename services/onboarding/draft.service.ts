import type { SupabaseClient } from "@supabase/supabase-js";

import {
  DEFAULT_POST_SETUP_CHECKLIST,
  POST_SETUP_CHECKLIST_META,
  type OnboardingDraft,
  type PostSetupChecklistItem,
} from "@/lib/onboarding/draft";
import { ok, fail, type ServiceResult } from "@/lib/result";
import { createOnboardingRepository } from "@/repositories/onboarding.repository";

export async function saveOnboardingDraft(
  client: SupabaseClient,
  userId: string,
  draft: OnboardingDraft,
): Promise<ServiceResult<void>> {
  const onboarding = createOnboardingRepository(client);

  const { error } = await onboarding.saveDraft({
    userId,
    businessName: draft.businessName,
    ownerName: draft.ownerName,
    email: draft.email,
    phone: draft.phone,
    website: draft.website,
    serviceArea: draft.serviceArea,
    cityState: draft.cityState,
    services: draft.services,
    businessHours: draft.businessHours,
    monthlyBudget: Number(draft.monthlyBudget) || 0,
    profileData: {
      wizardStep: draft.wizardStep,
      accountIntent: draft.accountIntent,
      businessEmail: draft.businessEmail,
      businessAddress: draft.businessAddress,
      industry: draft.industry,
      businessType: draft.businessType,
      targetAudience: draft.targetAudience,
      idealCustomer: draft.idealCustomer,
      offerPromotion: draft.offerPromotion,
      campaignGoal: draft.campaignGoal,
      brandTone: draft.brandTone,
      brandColors: draft.brandColors,
      existingWebsite: draft.existingWebsite,
      existingCrm: draft.existingCrm,
      leadNotifyEmail: draft.leadNotifyEmail,
      leadNotifyPhone: draft.leadNotifyPhone,
    },
  });

  if (error) return fail(error.message, "DRAFT_SAVE_FAILED");
  return ok(undefined);
}

export async function loadPostSetupChecklist(
  client: SupabaseClient,
  userId: string,
): Promise<PostSetupChecklistItem[]> {
  const onboarding = createOnboardingRepository(client);
  const { data } = await onboarding.getByUserId(userId);
  if (!data) return [];

  const raw = (data.checklist ?? {}) as Record<string, boolean>;
  const merged = { ...DEFAULT_POST_SETUP_CHECKLIST, ...raw };

  return POST_SETUP_CHECKLIST_META.map((meta) => ({
    ...meta,
    done: Boolean(merged[meta.key]),
  })).filter((item) => item.key !== "profile_complete");
}

export async function hasIncompletePostSetup(
  client: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const items = await loadPostSetupChecklist(client, userId);
  return items.some((i) => !i.done);
}
