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
import { createBusinessRepository } from "@/repositories/business.repository";
import { createOnboardingRepository } from "@/repositories/onboarding.repository";
import type { BillingPlanName } from "@/types/backend";
import type { CampaignGoalId, OnboardingWizardPayload } from "@/types/platform-growth";
import type {
  BusinessProfileFields,
  OfferGoalsFields,
} from "@/types/ceo-command-center";

function goalToCampaignGoal(goal: OfferGoalsFields["primaryGoal"]): CampaignGoalId {
  if (goal === "bookings") return "book_appointments";
  if (goal === "forms") return "form_submissions";
  if (goal === "sales" || goal === "revenue") return "sell_products";
  if (goal === "email_sms_list") return "grow_email_list";
  if (goal === "local_visits") return "local_ads";
  return "generate_leads";
}

function parseCurrency(value: string): number {
  const parsed = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function fallbackBusinessName(profile: BusinessProfileFields, email?: string | null): string {
  const fromProfile = profile.businessName.trim();
  if (fromProfile) return fromProfile;
  const fromEmail = email?.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  return fromEmail || "Diazites Business";
}

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

export async function completeCommandCenterOnboardingAction(
  profile: BusinessProfileFields,
  offerGoals: OfferGoalsFields,
) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false as const, error: "Not signed in." };

  const ensured = await ensurePublicUserRecord(user.id, user.email);
  if (!ensured.success) {
    return { success: false as const, error: ensured.error };
  }

  const businessName = fallbackBusinessName(profile, user.email);
  const campaignGoal = goalToCampaignGoal(offerGoals.primaryGoal);
  const monthlyBudget = parseCurrency(offerGoals.averageDealValue);
  const selectedAgents = ["landing", "pipeline", "workflow", "email"];
  const businessProfile = {
    industry: profile.industry || undefined,
    businessType: offerGoals.offerType,
    businessEmail: profile.email || user.email || undefined,
    businessAddress: profile.address || undefined,
    serviceAreas: profile.address || undefined,
    mainServices: profile.services || undefined,
    targetAudience: profile.targetCustomer || undefined,
    idealCustomer: profile.targetCustomer || undefined,
    offerPromotion: profile.mainOffer || undefined,
    campaignGoal,
    brandTone: "Professional, helpful, conversion-focused",
    existingWebsite: profile.website || undefined,
    leadNotifyEmail: profile.email || user.email || undefined,
    leadNotifyPhone: profile.phone || undefined,
  };

  const businesses = createBusinessRepository(supabase);
  const { data: existingBusiness } = await businesses.getByOwnerUserId(user.id);

  if (existingBusiness) {
    await businesses.update(existingBusiness.id, {
      name: businessName,
      website: profile.website || null,
      serviceArea: profile.address || null,
      services: profile.services || null,
      businessHours: profile.businessHours || null,
      monthlyBudget,
    });
    await businesses.updateProfile(existingBusiness.id, businessProfile);

    const onboarding = createOnboardingRepository(supabase);
    await onboarding.upsertFull({
      userId: user.id,
      businessName,
      ownerName: (user.user_metadata?.full_name as string | undefined) ?? "",
      email: user.email ?? profile.email,
      phone: profile.phone,
      website: profile.website,
      serviceArea: profile.address,
      cityState: profile.address,
      services: profile.services,
      businessHours: profile.businessHours,
      monthlyBudget,
      stage: "live",
      status: "completed",
      profileData: {
        ...businessProfile,
        mainOffer: profile.mainOffer,
        monthlyTarget: offerGoals.monthlyTarget,
        averageDealValue: offerGoals.averageDealValue,
        preferredConversionAction: offerGoals.preferredConversionAction,
        selectedAgents,
        accountIntent: "direct",
        wizardStep: 10,
      },
      checklist: {
        profile_complete: true,
        integrations_connected: false,
        agents_assigned: true,
        campaign_built: true,
        landing_page_ready: true,
        ai_active: true,
        team_invited: false,
      },
    });
  } else {
    const result = await completeOnboardingProfile(
      supabase,
      user.id,
      {
        businessName,
        ownerName: (user.user_metadata?.full_name as string | undefined) ?? "",
        email: user.email ?? profile.email,
        phone: profile.phone,
        website: profile.website,
        businessEmail: profile.email || user.email || undefined,
        businessAddress: profile.address || undefined,
        serviceArea: profile.address,
        cityState: profile.address,
        services: profile.services,
        businessHours: profile.businessHours,
        monthlyBudget,
        industry: profile.industry || undefined,
        businessType: offerGoals.offerType,
        mainServices: profile.services || undefined,
        targetAudience: profile.targetCustomer || undefined,
        idealCustomer: profile.targetCustomer || undefined,
        offerPromotion: profile.mainOffer || undefined,
        campaignGoal,
        brandTone: "Professional, helpful, conversion-focused",
        existingWebsite: profile.website || undefined,
        leadNotifyEmail: profile.email || user.email || undefined,
        leadNotifyPhone: profile.phone || undefined,
        accountIntent: "direct",
        selectedAgents,
        skippedConnections: [],
      },
      {
        trialPlanName: normalizeSignupPlan(
          (user.user_metadata?.selected_plan as string | undefined) ?? "Starter",
        ) as BillingPlanName,
      },
    );

    if (!result.success) {
      return { success: false as const, error: result.error };
    }
  }

  revalidatePath("/", "layout");
  revalidatePath("/dashboard", "layout");
  revalidatePath("/onboarding", "layout");

  return {
    success: true as const,
    redirectTo: missionControlLandingPath({
      postLogin: true,
      extra: { onboarding: "complete" },
    }),
  };
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
