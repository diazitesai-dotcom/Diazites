"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  draftToWizardPayload,
  type OnboardingDraft,
} from "@/lib/onboarding/draft";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { saveOnboardingDraft } from "@/services/onboarding/draft.service";
import { completeOnboardingProfile } from "@/services/onboarding/onboarding-completion.service";
import { autofillOnboardingFromWebsite } from "@/services/onboarding/website-autofill.service";
import { normalizeSignupPlan } from "@/lib/billing/signup-plans";
import { ensurePublicUserRecord } from "@/lib/auth/ensure-public-user";
import { createBusinessRepository } from "@/repositories/business.repository";
import { createOnboardingRepository } from "@/repositories/onboarding.repository";
import type { BillingPlanName } from "@/types/backend";
import type { CampaignGoalId, OnboardingWizardPayload } from "@/types/platform-growth";
import type { CommandCenterLaunchPayload } from "@/lib/onboarding/command-center-payload";
import type {
  BusinessProfileFields,
  OfferGoalsFields,
} from "@/types/ceo-command-center";
import { materializeCommandCenterLaunch } from "@/services/onboarding/command-center-launch.service";

type PauseSnapshot = {
  pausedAt: string;
  platformAccountSettings?: {
    status?: string | null;
    featureFlags?: Record<string, unknown> | null;
  };
  agents: { agent_type: string; status: string }[];
  campaigns: { id: string; status: string }[];
  adCampaigns: { id: string; status: string }[];
  automationRules: { id: string; enabled: boolean }[];
  workflows: { id: string; status: string }[];
  emailCampaigns: { id: string; status: string }[];
  emailAutomations: { id: string; status: string }[];
  aiTextAgents: { id: string; status: string }[];
  aiCallingAgents: { id: string; status: string }[];
};

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

async function requireCurrentBusiness() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false as const, error: "Not signed in." };

  const businesses = createBusinessRepository(supabase);
  const { data: business, error } = await businesses.getByOwnerUserId(user.id);
  if (error) return { success: false as const, error: error.message };
  if (!business) return { success: false as const, error: "No business found for this account." };

  return { success: true as const, supabase, user, business };
}

function recordList<Row extends Record<string, unknown>>(
  rows: Row[] | null,
  statusKey = "status",
) {
  return (rows ?? [])
    .filter((row) => typeof row.id === "string" && typeof row[statusKey] === "string")
    .map((row) => ({
      id: String(row.id),
      status: String(row[statusKey]),
    }));
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
  return { success: true as const, redirectTo: "/dashboard/launch-review?onboarding=complete" };
}

export async function completeCommandCenterOnboardingAction(
  profile: BusinessProfileFields,
  offerGoals: OfferGoalsFields,
  launchPayload?: CommandCenterLaunchPayload,
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
  let businessId: string | undefined = existingBusiness?.id;

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
        primaryGoal: offerGoals.primaryGoal,
        keywords: profile.keywords,
        seoMetaTitle: profile.seoMetaTitle,
        seoMetaDescription: profile.seoMetaDescription,
        businessDescription: profile.businessDescription,
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
    businessId = result.data.businessId;
  }

  if (businessId && launchPayload) {
    const materialized = await materializeCommandCenterLaunch(
      supabase,
      user.id,
      businessId,
      profile,
      offerGoals,
      launchPayload,
    );
    if (!materialized.success) {
      return { success: false as const, error: materialized.error };
    }
  }

  revalidatePath("/", "layout");
  revalidatePath("/dashboard", "layout");
  revalidatePath("/onboarding", "layout");

  return {
    success: true as const,
    redirectTo: "/dashboard/launch-review?onboarding=complete",
  };
}

export async function pauseFullOnboardingSetupAction() {
  const context = await requireCurrentBusiness();
  if (!context.success) return context;

  const { supabase, user, business } = context;
  const businessId = business.id;
  const now = new Date().toISOString();

  const [
    onboardingResult,
    agentResult,
    campaignResult,
    adCampaignResult,
    automationRuleResult,
    workflowResult,
    emailCampaignResult,
    emailAutomationResult,
    aiTextAgentResult,
    aiCallingAgentResult,
  ] = await Promise.all([
    supabase.from("onboarding").select("profile_data").eq("user_id", user.id).maybeSingle(),
    supabase.from("agents").select("agent_type, status").eq("business_id", businessId).eq("status", "active"),
    supabase.from("campaigns").select("id, status").eq("business_id", businessId).eq("status", "active"),
    supabase.from("ad_campaigns").select("id, status").eq("business_id", businessId).eq("status", "active"),
    supabase.from("automation_rules").select("id, enabled").eq("business_id", businessId).eq("enabled", true),
    supabase.from("diazites_workflows").select("id, status").eq("business_id", businessId).eq("status", "active"),
    supabase
      .from("email_campaigns")
      .select("id, status")
      .eq("business_id", businessId)
      .in("status", ["active", "scheduled"]),
    supabase.from("email_automations").select("id, status").eq("business_id", businessId).eq("status", "active"),
    supabase.from("ai_text_agents").select("id, status").eq("business_id", businessId).eq("status", "active"),
    supabase.from("ai_calling_agents").select("id, status").eq("business_id", businessId).eq("status", "active"),
  ]);

  const service = createServiceRoleClient();
  const { data: platformSettings } = await service
    .from("platform_account_settings")
    .select("status, feature_flags")
    .eq("business_id", businessId)
    .maybeSingle();

  const profileData =
    onboardingResult.data?.profile_data && typeof onboardingResult.data.profile_data === "object"
      ? (onboardingResult.data.profile_data as Record<string, unknown>)
      : {};

  const snapshot: PauseSnapshot = {
    pausedAt: now,
    platformAccountSettings: {
      status:
        typeof platformSettings?.status === "string" ? platformSettings.status : null,
      featureFlags:
        platformSettings?.feature_flags && typeof platformSettings.feature_flags === "object"
          ? (platformSettings.feature_flags as Record<string, unknown>)
          : null,
    },
    agents: (agentResult.data ?? []).map((agent) => ({
      agent_type: String(agent.agent_type),
      status: String(agent.status),
    })),
    campaigns: recordList(campaignResult.data),
    adCampaigns: recordList(adCampaignResult.data),
    automationRules: (automationRuleResult.data ?? []).map((rule) => ({
      id: String(rule.id),
      enabled: Boolean(rule.enabled),
    })),
    workflows: recordList(workflowResult.data),
    emailCampaigns: recordList(emailCampaignResult.data),
    emailAutomations: recordList(emailAutomationResult.data),
    aiTextAgents: recordList(aiTextAgentResult.data),
    aiCallingAgents: recordList(aiCallingAgentResult.data),
  };

  const { error: onboardingError } = await supabase
    .from("onboarding")
    .update({
      status: "paused",
      checklist: {
        profile_complete: true,
        integrations_connected: false,
        agents_assigned: snapshot.agents.length > 0,
        campaign_built: snapshot.campaigns.length + snapshot.adCampaigns.length > 0,
        landing_page_ready: true,
        ai_active: false,
        team_invited: false,
      },
      profile_data: {
        ...profileData,
        launchPauseSnapshot: snapshot,
      },
    })
    .eq("user_id", user.id);

  if (onboardingError) return { success: false as const, error: onboardingError.message };

  await Promise.all([
    supabase.from("agents").update({ status: "inactive", activated_at: null }).eq("business_id", businessId).eq("status", "active"),
    supabase.from("campaigns").update({ status: "paused" }).eq("business_id", businessId).eq("status", "active"),
    supabase.from("ad_campaigns").update({ status: "paused" }).eq("business_id", businessId).eq("status", "active"),
    supabase.from("automation_rules").update({ enabled: false }).eq("business_id", businessId).eq("enabled", true),
    supabase.from("diazites_workflows").update({ status: "paused", updated_at: now }).eq("business_id", businessId).eq("status", "active"),
    supabase
      .from("email_campaigns")
      .update({ status: "paused", updated_at: now })
      .eq("business_id", businessId)
      .in("status", ["active", "scheduled"]),
    supabase.from("email_automations").update({ status: "paused" }).eq("business_id", businessId).eq("status", "active"),
    supabase.from("ai_text_agents").update({ status: "paused", updated_at: now }).eq("business_id", businessId).eq("status", "active"),
    supabase.from("ai_calling_agents").update({ status: "paused" }).eq("business_id", businessId).eq("status", "active"),
    service
      .from("platform_account_settings")
      .upsert(
        {
          business_id: businessId,
          account_type: "direct",
          status: "suspended",
          feature_flags: {
            merchant_services: false,
            ai_calls: false,
            sms: false,
            email_campaigns: false,
            workflows: false,
            ai_agents: false,
            ad_accounts: false,
            white_label: false,
            funnel_studio: false,
            integrations: false,
          },
          updated_at: now,
          updated_by: user.id,
        },
        { onConflict: "business_id" },
      ),
  ]);

  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/launch-review");
  return { success: true as const };
}

export async function activateFullOnboardingSetupAction() {
  const context = await requireCurrentBusiness();
  if (!context.success) return context;

  const { supabase, user, business } = context;
  const businessId = business.id;
  const now = new Date().toISOString();

  const { data: onboarding, error } = await supabase
    .from("onboarding")
    .select("profile_data")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return { success: false as const, error: error.message };

  const profileData =
    onboarding?.profile_data && typeof onboarding.profile_data === "object"
      ? (onboarding.profile_data as Record<string, unknown>)
      : {};
  const snapshot = profileData.launchPauseSnapshot as PauseSnapshot | undefined;

  const restoredProfileData = { ...profileData };
  delete restoredProfileData.launchPauseSnapshot;

  await Promise.all([
    ...(snapshot?.agents ?? []).map((agent) =>
      supabase
        .from("agents")
        .update({ status: "active", activated_at: now })
        .eq("business_id", businessId)
        .eq("agent_type", agent.agent_type),
    ),
    ...(snapshot?.campaigns ?? []).map((campaign) =>
      supabase.from("campaigns").update({ status: campaign.status }).eq("business_id", businessId).eq("id", campaign.id),
    ),
    ...(snapshot?.adCampaigns ?? []).map((campaign) =>
      supabase.from("ad_campaigns").update({ status: campaign.status }).eq("business_id", businessId).eq("id", campaign.id),
    ),
    ...(snapshot?.automationRules ?? []).map((rule) =>
      supabase.from("automation_rules").update({ enabled: rule.enabled }).eq("business_id", businessId).eq("id", rule.id),
    ),
    ...(snapshot?.workflows ?? []).map((workflow) =>
      supabase
        .from("diazites_workflows")
        .update({ status: workflow.status, updated_at: now })
        .eq("business_id", businessId)
        .eq("id", workflow.id),
    ),
    ...(snapshot?.emailCampaigns ?? []).map((campaign) =>
      supabase
        .from("email_campaigns")
        .update({ status: campaign.status, updated_at: now })
        .eq("business_id", businessId)
        .eq("id", campaign.id),
    ),
    ...(snapshot?.emailAutomations ?? []).map((automation) =>
      supabase.from("email_automations").update({ status: automation.status }).eq("business_id", businessId).eq("id", automation.id),
    ),
    ...(snapshot?.aiTextAgents ?? []).map((agent) =>
      supabase
        .from("ai_text_agents")
        .update({ status: agent.status, updated_at: now })
        .eq("business_id", businessId)
        .eq("id", agent.id),
    ),
    ...(snapshot?.aiCallingAgents ?? []).map((agent) =>
      supabase.from("ai_calling_agents").update({ status: agent.status }).eq("business_id", businessId).eq("id", agent.id),
    ),
  ]);

  const service = createServiceRoleClient();
  const platformSettingsRow: Record<string, unknown> = {
    business_id: businessId,
    account_type: "direct",
    status: snapshot?.platformAccountSettings?.status || "active",
    updated_at: now,
    updated_by: user.id,
  };
  if (snapshot?.platformAccountSettings?.featureFlags) {
    platformSettingsRow.feature_flags = snapshot.platformAccountSettings.featureFlags;
  }

  await service
    .from("platform_account_settings")
    .upsert(platformSettingsRow, { onConflict: "business_id" });

  const { error: updateError } = await supabase
    .from("onboarding")
    .update({
      stage: "live",
      status: "completed",
      profile_data: restoredProfileData,
      checklist: {
        profile_complete: true,
        integrations_connected: true,
        agents_assigned: (snapshot?.agents.length ?? 0) > 0,
        campaign_built: (snapshot?.campaigns.length ?? 0) + (snapshot?.adCampaigns.length ?? 0) > 0,
        landing_page_ready: true,
        ai_active: (snapshot?.agents.length ?? 0) > 0,
        team_invited: false,
      },
    })
    .eq("user_id", user.id);

  if (updateError) return { success: false as const, error: updateError.message };

  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/launch-review");
  return { success: true as const };
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
  redirect("/dashboard/launch-review?onboarding=complete");
}
