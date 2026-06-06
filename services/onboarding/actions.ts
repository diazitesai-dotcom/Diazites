"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { missionControlLandingPath } from "@/lib/auth/mission-control-routing";
import {
  draftToWizardPayload,
  type OnboardingDraft,
} from "@/lib/onboarding/draft";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { saveOnboardingDraft } from "@/services/onboarding/draft.service";
import { completeOnboardingProfile } from "@/services/onboarding/onboarding-completion.service";
import { autofillOnboardingFromWebsite } from "@/services/onboarding/website-autofill.service";
import { normalizeSignupPlan } from "@/lib/billing/signup-plans";
import { ensurePublicUserRecord } from "@/lib/auth/ensure-public-user";
import type { BillingPlanName } from "@/types/backend";
import type { CampaignGoalId, OnboardingWizardPayload } from "@/types/platform-growth";

function parseOnboardingForm(formData: FormData): OnboardingWizardPayload {
  const campaignGoal = String(formData.get("campaign_goal") ?? "generate_leads");
  const accountIntent = String(formData.get("account_intent") ?? "direct");
  return {
    businessName: String(formData.get("business_name") ?? ""),
    ownerName: String(formData.get("owner_name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    website: String(formData.get("website") ?? ""),
    businessEmail: String(formData.get("business_email") ?? "") || undefined,
    businessAddress: String(formData.get("business_address") ?? "") || undefined,
    serviceArea: String(formData.get("service_area") ?? ""),
    cityState: String(formData.get("city_state") ?? ""),
    services: String(formData.get("services") ?? ""),
    businessHours: String(formData.get("business_hours") ?? ""),
    monthlyBudget: Number(formData.get("monthly_budget") ?? 0),
    industry: String(formData.get("industry") ?? "") || undefined,
    businessType: String(formData.get("business_type") ?? "") || undefined,
    mainServices: String(formData.get("services") ?? "") || undefined,
    targetAudience: String(formData.get("target_audience") ?? "") || undefined,
    idealCustomer: String(formData.get("ideal_customer") ?? "") || undefined,
    offerPromotion: String(formData.get("offer_promotion") ?? "") || undefined,
    campaignGoal: campaignGoal as CampaignGoalId,
    brandTone: String(formData.get("brand_tone") ?? "") || undefined,
    brandColors: String(formData.get("brand_colors") ?? "") || undefined,
    existingCrm: String(formData.get("existing_crm") ?? "") || undefined,
    existingWebsite: String(formData.get("existing_website") ?? "") || undefined,
    leadNotifyEmail: String(formData.get("lead_notify_email") ?? "") || undefined,
    leadNotifyPhone: String(formData.get("lead_notify_phone") ?? "") || undefined,
    accountIntent:
      accountIntent === "agency" || accountIntent === "sub_account"
        ? accountIntent
        : "direct",
  };
}

export async function saveOnboardingDraftAction(draft: OnboardingDraft) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false as const, error: "Not signed in" };

  const result = await saveOnboardingDraft(supabase, user.id, draft, user.email);
  if (!result.success) return { success: false as const, error: result.error };
  return { success: true as const };
}

export async function autofillOnboardingFromWebsiteAction(
  websiteUrl: string,
  currentDraft: OnboardingDraft,
) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false as const, error: "Not signed in" };

  await ensurePublicUserRecord(user.id, user.email);

  const result = await autofillOnboardingFromWebsite(
    supabase,
    user.id,
    websiteUrl,
    currentDraft,
  );

  if (!result.success) return { success: false as const, error: result.error };
  return { success: true as const, data: result.data };
}

export async function completeOnboardingFromDraftAction(draft: OnboardingDraft) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false as const, error: "Not signed in." };

  const ensured = await ensurePublicUserRecord(user.id, user.email);
  if (!ensured.success) {
    return { success: false as const, error: ensured.error };
  }

  if (draft.accountIntent === "sub_account") {
    return {
      success: false as const,
      error:
        "Sub-accounts are created by your agency. Use their invite link or ask them to add you under Platform accounts.",
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

  revalidatePath("/", "layout");
  revalidatePath("/dashboard", "layout");
  return { success: true as const, redirectTo: missionControlLandingPath({ postLogin: true, extra: { onboarding: "complete" } }) };
}

/** @deprecated Prefer completeOnboardingFromDraftAction — kept for legacy form posts */
export async function saveOnboardingAction(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const form = parseOnboardingForm(formData);
  if (form.accountIntent === "sub_account") {
    redirect(
      "/onboarding?error=" +
        encodeURIComponent(
          "Sub-accounts are created by your agency. Use their invite link or ask them to add you under Platform accounts.",
        ),
    );
  }

  const selectedPlan = normalizeSignupPlan(
    (user.user_metadata?.selected_plan as string | undefined) ?? "Starter",
  ) as BillingPlanName;

  const result = await completeOnboardingProfile(supabase, user.id, form, {
    trialPlanName: selectedPlan,
  });

  if (!result.success) {
    redirect(`/onboarding?error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath("/", "layout");
  revalidatePath("/dashboard", "layout");
  redirect(missionControlLandingPath({ postLogin: true, extra: { onboarding: "complete" } }));
}
