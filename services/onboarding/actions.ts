"use server";

import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { completeOnboardingProfile } from "@/services/onboarding/onboarding-completion.service";
import type { CampaignGoalId, OnboardingWizardPayload } from "@/types/platform-growth";

function parseOnboardingForm(formData: FormData): OnboardingWizardPayload {
  const campaignGoal = String(formData.get("campaign_goal") ?? "generate_leads");
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
  };
}

export async function saveOnboardingAction(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const form = parseOnboardingForm(formData);
  const result = await completeOnboardingProfile(supabase, user.id, form);

  if (!result.success) {
    redirect(`/onboarding?error=${encodeURIComponent(result.error)}`);
  }

  redirect("/dashboard");
}
