"use server";

import {
  deleteLaunchStep,
  duplicateLaunchStep,
  generateLaunchPlanFromDraft,
  regenerateLaunchStep,
  reorderLaunchSteps,
  updateLaunchStepData,
} from "@/lib/launch-builder/generate-launch-plan";
import type { LaunchPlan, LaunchStepKind } from "@/lib/launch-builder/types";
import {
  draftToWizardPayload,
  type OnboardingDraft,
} from "@/lib/onboarding/draft";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { materializeLaunchPlan } from "@/services/launch-builder/materialize-launch-plan.service";
import { completeOnboardingProfile } from "@/services/onboarding/onboarding-completion.service";
import { normalizeSignupPlan } from "@/lib/billing/signup-plans";
import { ensurePublicUserRecord } from "@/lib/auth/ensure-public-user";
import type { BillingPlanName } from "@/types/backend";
import { revalidatePath } from "next/cache";

export async function generateLaunchPlanAction(draft: OnboardingDraft) {
  const plan = generateLaunchPlanFromDraft(draft);
  return { success: true as const, plan };
}

export async function regenerateLaunchStepAction(
  draft: OnboardingDraft,
  plan: LaunchPlan,
  kind: LaunchStepKind,
) {
  const next = regenerateLaunchStep(draft, kind, plan);
  return { success: true as const, plan: next };
}

export async function updateLaunchPlanAction(plan: LaunchPlan) {
  return { success: true as const, plan };
}

export async function duplicateLaunchStepAction(plan: LaunchPlan, stepId: string) {
  return { success: true as const, plan: duplicateLaunchStep(plan, stepId) };
}

export async function deleteLaunchStepAction(plan: LaunchPlan, stepId: string) {
  return { success: true as const, plan: deleteLaunchStep(plan, stepId) };
}

export async function reorderLaunchStepsAction(plan: LaunchPlan, stepIds: string[]) {
  return { success: true as const, plan: reorderLaunchSteps(plan, stepIds) };
}

export async function editLaunchStepFieldAction(
  plan: LaunchPlan,
  stepId: string,
  data: Record<string, unknown>,
) {
  return { success: true as const, plan: updateLaunchStepData(plan, stepId, data) };
}

export async function approveAndLaunchAction(
  draft: OnboardingDraft,
  plan: LaunchPlan,
) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false as const, error: "Not signed in." };

  const ensured = await ensurePublicUserRecord(user.id, user.email);
  if (!ensured.success) return { success: false as const, error: ensured.error };

  if (draft.accountIntent === "sub_account") {
    return {
      success: false as const,
      error: "Sub-accounts must be created by your agency.",
    };
  }

  const selectedPlan = normalizeSignupPlan(
    (user.user_metadata?.selected_plan as string | undefined) ?? "Starter",
  ) as BillingPlanName;

  const form = draftToWizardPayload(draft);
  const result = await completeOnboardingProfile(supabase, user.id, form, {
    trialPlanName: selectedPlan,
  });

  if (!result.success) {
    return { success: false as const, error: result.error };
  }

  const materialized = await materializeLaunchPlan(
    supabase,
    user.id,
    result.data.businessId,
    plan,
    {
      industry: draft.industry,
      businessType: draft.businessType,
      services: draft.services,
      businessName: draft.businessName,
    },
  );

  if (!materialized.success) {
    return {
      success: false as const,
      error: materialized.error ?? "Launch materialization failed",
    };
  }

  revalidatePath("/", "layout");
  revalidatePath("/dashboard", "layout");

  return {
    success: true as const,
    redirectTo: "/dashboard/launch-review?onboarding=complete&launch=ready",
    materialized: materialized.data,
  };
}

export async function saveLaunchDraftAction(draft: OnboardingDraft, plan: LaunchPlan) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Not signed in" };

  await supabase.from("onboarding").upsert(
    {
      user_id: user.id,
      profile_data: {
        launchPlanDraft: plan,
        wizardStep: draft.wizardStep,
        accountIntent: draft.accountIntent,
        selectedAgents: draft.selectedAgents,
        skippedConnections: draft.skippedConnections,
      },
    },
    { onConflict: "user_id" },
  );

  return { success: true as const };
}
