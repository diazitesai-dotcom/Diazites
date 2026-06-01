import type { SupabaseClient } from "@supabase/supabase-js";

import { ensurePublicUserRecord } from "@/lib/auth/ensure-public-user";
import {
  DEFAULT_POST_SETUP_CHECKLIST,
  POST_SETUP_CHECKLIST_META,
  type OnboardingDraft,
  type PostSetupChecklistItem,
} from "@/lib/onboarding/draft";
import { resolveIntegrationsConnectedForUser } from "@/lib/integrations/integration-connection-status";
import { ok, fail, type ServiceResult } from "@/lib/result";
import { createOnboardingRepository } from "@/repositories/onboarding.repository";

export async function saveOnboardingDraft(
  client: SupabaseClient,
  userId: string,
  draft: OnboardingDraft,
  email?: string | null,
): Promise<ServiceResult<void>> {
  const ensured = await ensurePublicUserRecord(userId, email ?? draft.email);
  if (!ensured.success) return ensured;

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
      selectedAgents: draft.selectedAgents,
      skippedConnections: draft.skippedConnections,
    },
  });

  if (error) return fail(error.message, "DRAFT_SAVE_FAILED");
  return ok(undefined);
}

export async function loadPostSetupChecklist(
  client: SupabaseClient,
  userId: string,
  businessId?: string | null,
): Promise<PostSetupChecklistItem[]> {
  const onboarding = createOnboardingRepository(client);
  const { data } = await onboarding.getByUserId(userId);

  const raw = (data?.checklist ?? {}) as Record<string, boolean>;
  const merged = { ...DEFAULT_POST_SETUP_CHECKLIST, ...raw };
  const integrationsDone = await resolveIntegrationsConnectedForUser(
    client,
    userId,
    Boolean(merged.integrations_connected),
    businessId,
  );

  return POST_SETUP_CHECKLIST_META.map((meta) => ({
    ...meta,
    done:
      meta.key === "integrations_connected"
        ? integrationsDone
        : Boolean(merged[meta.key]),
  })).filter((item) => item.key !== "profile_complete");
}

export async function hasIncompletePostSetup(
  client: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const items = await loadPostSetupChecklist(client, userId);
  return items.some((i) => !i.done);
}
