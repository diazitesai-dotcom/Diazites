import type { SupabaseClient } from "@supabase/supabase-js";

import { createBusinessRepository } from "@/repositories/business.repository";
import { getOnboardingCommandCenterMockData } from "@/lib/ceo-command-center/mock-data";
import { sanitizeBusinessProfile } from "@/lib/ceo-command-center/business-profile-utils";
import type {
  IntegrationOption,
  OfferGoalsFields,
  OnboardingCommandCenterData,
  OfferType,
  PreferredConversionAction,
  PrimaryGoal,
  ReviewChecklistItem,
} from "@/types/ceo-command-center";

type OnboardingRow = {
  business_name: string | null;
  website: string | null;
  service_area: string | null;
  services: string | null;
  business_hours: string | null;
  monthly_budget: number | null;
  stage: string | null;
  status: string | null;
  profile_data: Record<string, unknown> | null;
  checklist: Record<string, boolean> | null;
};

const OFFER_TYPES: OfferType[] = [
  "consultation",
  "estimate",
  "paid_service",
  "product_purchase",
  "appointment",
  "program_enrollment",
  "donation",
  "trial_demo",
  "limited_offer",
  "lead_magnet",
];

const PRIMARY_GOALS: PrimaryGoal[] = [
  "leads",
  "phone_calls",
  "forms",
  "bookings",
  "quote_requests",
  "sales",
  "revenue",
  "email_sms_list",
  "donations_sponsors",
  "program_enrollments",
  "local_visits",
  "customer_reactivation",
];

const CONVERSION_ACTIONS: PreferredConversionAction[] = [
  "call",
  "form",
  "booking",
  "checkout",
  "quote_request",
  "application",
  "email_signup",
  "sms_signup",
  "whatsapp",
  "live_chat",
  "donation",
  "download",
];

/** Maps onboarding.checklist keys to the review checklist item ids. */
const CHECKLIST_KEY_BY_ITEM_ID: Record<string, string> = {
  profile: "profile_complete",
  offer: "offer_complete",
  landing: "landing_page_ready",
  pipeline: "campaign_built",
  workflow: "campaign_built",
  accounts: "integrations_connected",
  agents: "agents_assigned",
  ads: "campaign_built",
  tracking: "tracking_ready",
};

/** Aliases so a connected ad_account platform string maps to an integration id. */
const PLATFORM_ALIASES: Record<string, string[]> = {
  google_ads: ["google", "google_ads", "googleads"],
  meta_ads: ["meta", "meta_ads", "facebook_ads"],
  facebook: ["facebook", "fb", "meta"],
  instagram: ["instagram", "ig"],
  tiktok: ["tiktok"],
  linkedin: ["linkedin"],
  youtube: ["youtube"],
  whatsapp: ["whatsapp"],
  gmail: ["gmail", "google_mail"],
  stripe: ["stripe"],
  zapier: ["zapier"],
  zernio: ["zernio"],
  google_business: ["google_business", "gbp", "google_business_profile"],
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function pickFromList<T extends string>(value: unknown, allowed: T[], fallback: T): T {
  const normalized = text(value);
  return (allowed as string[]).includes(normalized) ? (normalized as T) : fallback;
}

export async function loadOnboardingCommandCenterData(
  supabase: SupabaseClient,
  userId: string,
): Promise<OnboardingCommandCenterData | null> {
  const mock = getOnboardingCommandCenterMockData();

  const { data: onboarding } = await supabase
    .from("onboarding")
    .select(
      "business_name, website, service_area, services, business_hours, monthly_budget, stage, status, profile_data, checklist",
    )
    .eq("user_id", userId)
    .maybeSingle<OnboardingRow>();

  if (!onboarding) return null;

  const profile = onboarding.profile_data ?? {};
  const checklist = onboarding.checklist ?? {};

  const businessProfile = sanitizeBusinessProfile(
    {
      businessName: onboarding.business_name ?? "",
      industry: text(profile.industry),
      services: onboarding.services ?? text(profile.mainServices),
      address: onboarding.service_area ?? text(profile.businessAddress),
      phone: text(profile.leadNotifyPhone),
      email: text(profile.businessEmail) || text(profile.leadNotifyEmail),
      website: onboarding.website ?? text(profile.existingWebsite),
      businessHours: onboarding.business_hours ?? "",
      targetCustomer: text(profile.targetAudience) || text(profile.idealCustomer),
      keywords: text(profile.keywords),
      seoMetaTitle: text(profile.seoMetaTitle),
      seoMetaDescription: text(profile.seoMetaDescription),
      mainOffer: text(profile.mainOffer) || text(profile.offerPromotion),
      businessDescription: text(profile.businessDescription),
    },
    onboarding.website ?? text(profile.existingWebsite),
  );

  const offerGoals: OfferGoalsFields = {
    offerType: pickFromList(profile.businessType, OFFER_TYPES, mock.offerGoals.offerType),
    primaryGoal: pickFromList(profile.primaryGoal, PRIMARY_GOALS, mock.offerGoals.primaryGoal),
    monthlyTarget: text(profile.monthlyTarget) || mock.offerGoals.monthlyTarget,
    averageDealValue: text(profile.averageDealValue) || mock.offerGoals.averageDealValue,
    preferredConversionAction: pickFromList(
      profile.preferredConversionAction,
      CONVERSION_ACTIONS,
      mock.offerGoals.preferredConversionAction,
    ),
  };

  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(userId);

  let connectedPlatforms: string[] = [];
  if (business) {
    const { data: accounts } = await supabase
      .from("ad_accounts")
      .select("platform, status")
      .eq("business_id", business.id);
    connectedPlatforms = (accounts ?? [])
      .filter((account) => account.status === "connected")
      .map((account) => text(account.platform).toLowerCase());
  }

  const integrations: IntegrationOption[] = mock.integrations.map((integration) => {
    const aliases = PLATFORM_ALIASES[integration.id] ?? [integration.id];
    const connected = connectedPlatforms.some((platform) => aliases.includes(platform));
    return { ...integration, connected: connected || integration.connected };
  });

  const reviewChecklist: ReviewChecklistItem[] = mock.reviewChecklist.map((item) => {
    const key = CHECKLIST_KEY_BY_ITEM_ID[item.id];
    const complete = key ? checklist[key] === true : item.complete;
    return { ...item, complete };
  });

  return {
    steps: mock.steps,
    currentStepId: mock.currentStepId,
    businessProfile,
    offerGoals,
    landingPages: mock.landingPages,
    integrations,
    reviewChecklist,
  };
}
