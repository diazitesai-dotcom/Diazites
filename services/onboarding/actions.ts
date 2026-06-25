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
import { getPublicAppUrl } from "@/lib/env";
import { ensurePublicUserRecord } from "@/lib/auth/ensure-public-user";
import {
  autofillCeoBusinessProfileFromWebsite,
} from "@/lib/ceo-command-center/business-profile-autofill";
import { createEmptyBusinessProfile } from "@/lib/ceo-command-center/business-profile-utils";
import { createBusinessRepository } from "@/repositories/business.repository";
import { createOnboardingRepository } from "@/repositories/onboarding.repository";
import type { BillingPlanName } from "@/types/backend";
import type { CampaignGoalId, OnboardingWizardPayload } from "@/types/platform-growth";
import type { CommandCenterLaunchPayload } from "@/lib/onboarding/command-center-payload";
import type {
  AiLaunchSetupProgressStep,
  BusinessProfileFields,
  OfferGoalsFields,
} from "@/types/ceo-command-center";
import { materializeCommandCenterLaunch } from "@/services/onboarding/command-center-launch.service";
import { sendEmail } from "@/services/email/email.service";

const PRODUCTION_LAUNCH_REVIEW_URL = "https://www.diazites.com/dashboard/launch-review";

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

const AI_LAUNCH_PROGRESS_LABELS: Array<Pick<AiLaunchSetupProgressStep, "id" | "label">> = [
  { id: "scan_website", label: "Scanning website" },
  { id: "business_profile", label: "Building business profile" },
  { id: "offer_goals", label: "Creating offer and goals" },
  { id: "website", label: "Generating landing page / website" },
  { id: "pipeline", label: "Setting up CRM pipeline" },
  { id: "workflows", label: "Creating workflows" },
  { id: "ai_agents", label: "Configuring AI agents" },
  { id: "launch_review", label: "Preparing launch review" },
];

function buildAiLaunchProgress(
  completed: AiLaunchSetupProgressStep["id"][],
  needsReview: Partial<Record<AiLaunchSetupProgressStep["id"], string>> = {},
): AiLaunchSetupProgressStep[] {
  return AI_LAUNCH_PROGRESS_LABELS.map((step) => {
    if (needsReview[step.id]) {
      return { ...step, status: "needs_review", message: needsReview[step.id] };
    }
    return {
      ...step,
      status: completed.includes(step.id) ? "complete" : "pending",
    };
  });
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function deriveOfferGoals(profile: BusinessProfileFields): OfferGoalsFields {
  const combined = `${profile.industry} ${profile.services} ${profile.mainOffer} ${profile.businessDescription}`.toLowerCase();
  const isNonprofit = /nonprofit|donation|donor|sponsor|volunteer|community|youth|program/.test(combined);
  const isBooking = /appointment|consult|booking|schedule|medical|clinic|attorney|real estate/.test(combined);

  return {
    offerType: isNonprofit ? "donation" : isBooking ? "consultation" : "estimate",
    primaryGoal: isNonprofit ? "donations_sponsors" : isBooking ? "bookings" : "leads",
    monthlyTarget: isNonprofit
      ? "50 donor, volunteer, or program inquiries"
      : isBooking
        ? "40 booked appointments"
        : "100 qualified leads",
    averageDealValue: isNonprofit
      ? "Donation, volunteer signup, or enrolled participant"
      : profile.mainOffer || "Value per conversion",
    preferredConversionAction: isNonprofit ? "donation" : isBooking ? "booking" : "form",
  };
}

function slugifySetup(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "ai-launch"
  );
}

function buildAutoLaunchPayload(
  profile: BusinessProfileFields,
  offerGoals: OfferGoalsFields,
): CommandCenterLaunchPayload {
  const businessName = profile.businessName || "Your Business";
  const ctaText =
    offerGoals.preferredConversionAction === "booking"
      ? "Book Now"
      : offerGoals.preferredConversionAction === "donation"
        ? "Support the Mission"
        : "Get Started";

  return {
    landingTemplateId:
      offerGoals.preferredConversionAction === "booking"
        ? "booking"
        : offerGoals.preferredConversionAction === "donation"
          ? "lead_gen"
          : "lead_gen",
    landingDraft: {
      heroHeadline: profile.seoMetaTitle || `${businessName} can help you get results faster`,
      subheadline:
        profile.seoMetaDescription ||
        profile.businessDescription ||
        profile.mainOffer ||
        `AI-built Diazites funnel for ${businessName}.`,
      ctaText,
      offerDetails: profile.mainOffer || profile.services || `Connect with ${businessName}`,
      benefits:
        profile.services ||
        "Clear offer, fast follow-up, automated CRM handoff, and AI-supported conversions.",
      formFields: "Name, email, phone, message",
      socialProof: "Trusted by the community. Add testimonials during review.",
      faq: "What happens after I submit? Diazites creates a lead, pipeline record, and follow-up workflow.",
      thankYouMessage: "Thanks. Our team will follow up shortly.",
    },
    landingSettings: {
      ctaType:
        offerGoals.preferredConversionAction === "checkout"
          ? "checkout"
          : offerGoals.preferredConversionAction === "booking"
            ? "booking"
            : offerGoals.preferredConversionAction === "call"
              ? "call"
              : "form",
      buttonText: ctaText,
      pageSlug: `${slugifySetup(businessName)}-ai-launch`,
      trackingEvent: "ai_launch_form_submit",
      thankYouRedirect: "/thank-you",
      brandTone: "Professional, futuristic, helpful, conversion-focused",
    },
    pipelineWorkflow: {
      pipelineType:
        offerGoals.primaryGoal === "donations_sponsors"
          ? "Donation"
          : offerGoals.primaryGoal === "program_enrollments"
            ? "Enrollment"
            : offerGoals.primaryGoal === "bookings"
              ? "Booking"
              : "Sales",
      leadOwner: "Diazites AI Setup",
      responseSpeed: "Immediate",
      followUpStyle: "Fast response",
      followUpChannels: ["SMS", "Email", "Call"],
      qualificationQuestions:
        "What service or program are you interested in? What is your timeline? What is the best way to reach you?",
      bookingAction:
        offerGoals.preferredConversionAction === "booking"
          ? "Book an appointment"
          : "Capture lead and start follow-up",
      lostLeadRule: "Move to nurture after 7 days without response",
      stages: [
        "New Lead",
        "Contacted",
        "Qualified",
        offerGoals.preferredConversionAction === "booking" ? "Appointment Booked" : "Ready for Follow-Up",
        "Won",
        "Lost / Nurture",
      ],
      automations: [
        { id: "create_lead_record", label: "Create lead record", enabled: true },
        { id: "assign_owner_agent", label: "Assign owner/agent", enabled: true },
        { id: "send_confirmation_email", label: "Send confirmation email", enabled: true },
        { id: "send_sms_follow_up", label: "Send SMS follow-up", enabled: true },
        { id: "notify_business_owner", label: "Notify business owner", enabled: true },
        { id: "trigger_ai_follow_up", label: "Trigger AI follow-up", enabled: true },
      ],
      followUpMessages: {
        firstSms: `Thanks for reaching out to ${businessName}. We received your request and will follow up shortly.`,
        firstEmail: `Thanks for contacting ${businessName}. Here is what happens next: our team reviews your request and follows up with the best next step.`,
        voicemailScript: `Hi, this is ${businessName}. We are following up on your request. Please call us back when you can.`,
        followUpEmail: `Just checking in to see if you still need help from ${businessName}.`,
        finalReminder: `Final reminder from ${businessName}. Reply when you are ready to continue.`,
      },
    },
    pipelineTestPassed: false,
  };
}

async function sendAiLaunchRegistrationEmail(input: {
  to: string;
  businessName: string;
  websiteUrl: string;
}) {
  const appUrl = getPublicAppUrl();
  const reviewUrl = PRODUCTION_LAUNCH_REVIEW_URL || `${appUrl}/dashboard/launch-review`;
  const registrationUrl = `${appUrl}/onboarding?step=business_profile`;
  const subject = "Your Diazites AI setup is ready to finish";
  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;background:#070914;font-family:system-ui,-apple-system,sans-serif;color:#e5e7eb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;margin:0 auto;padding:32px 20px;">
    <tr>
      <td style="padding:28px;border:1px solid rgba(139,92,246,.28);border-radius:22px;background:linear-gradient(135deg,rgba(124,58,237,.18),rgba(8,13,29,.96));">
        <p style="margin:0 0 10px;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#67e8f9;font-weight:700;">Diazites AI Launch Setup</p>
        <h1 style="margin:0;font-size:28px;line-height:1.15;color:#fff;">Your agents are staged for ${input.businessName}</h1>
        <p style="margin:18px 0 0;font-size:15px;line-height:1.7;color:#cbd5e1;">
          Diazites scanned <strong>${input.websiteUrl}</strong>, prepared your AI launch setup, and staged the next steps for your funnel, CRM pipeline, workflows, and agents.
        </p>
        <p style="margin:16px 0 0;font-size:15px;line-height:1.7;color:#cbd5e1;">
          Use the full registration form to review or update the information before activating everything.
        </p>
        <p style="margin:24px 0 0;">
          <a href="${registrationUrl}" style="display:inline-block;margin-right:10px;margin-bottom:10px;background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;text-decoration:none;font-weight:700;padding:13px 20px;border-radius:12px;">
            Finish Full Registration
          </a>
          <a href="${reviewUrl}" style="display:inline-block;margin-bottom:10px;border:1px solid rgba(255,255,255,.16);color:#e9d5ff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:12px;">
            Open Launch Review
          </a>
        </p>
        <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#94a3b8;">
          If you used Google or Facebook signup, you can add billing/card details from your dashboard billing area before activating paid features.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
  const text = `Your Diazites AI setup is ready for ${input.businessName}.

Diazites scanned ${input.websiteUrl} and prepared your funnel, CRM pipeline, workflows, and agents.

Finish the full registration form:
${registrationUrl}

Open Launch Review:
${reviewUrl}

If you used Google or Facebook signup, you can add billing/card details from your dashboard billing area before activating paid features.`;

  await sendEmail({ to: input.to, subject, html, text });
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

export async function startAiLaunchSetupAction(input: {
  websiteUrl: string;
  email: string;
  businessName?: string;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false as const, error: "Not signed in." };

  const websiteUrl = input.websiteUrl.trim();
  const email = input.email.trim() || user.email || "";
  const businessName = input.businessName?.trim() ?? "";
  if (!websiteUrl) return { success: false as const, error: "Enter your website URL." };
  if (!email) return { success: false as const, error: "Enter your email address." };

  const needsReview: Partial<Record<AiLaunchSetupProgressStep["id"], string>> = {};
  const completed: AiLaunchSetupProgressStep["id"][] = [];

  const ensured = await ensurePublicUserRecord(user.id, user.email ?? email);
  if (!ensured.success) {
    return { success: false as const, error: ensured.error };
  }

  let profile: BusinessProfileFields = createEmptyBusinessProfile(websiteUrl);

  const scanResult = await withTimeout(
    autofillCeoBusinessProfileFromWebsite(
      supabase,
      websiteUrl,
      createEmptyBusinessProfile(websiteUrl),
    ),
    20_000,
    "Website scan took too long. Review the business profile after setup.",
  ).catch((e) => ({
    success: false as const,
    error:
      e instanceof Error
        ? e.message
        : "Website scan could not complete. Review the business profile after setup.",
  }));

  if (scanResult.success) {
    profile = scanResult.data.profile;
    completed.push("scan_website", "business_profile");
  } else {
    needsReview.scan_website = scanResult.error;
    needsReview.business_profile = "Website scan could not complete. Review this profile after setup.";
  }

  profile = {
    ...profile,
    businessName: businessName || profile.businessName || fallbackBusinessName(profile, email),
    email: profile.email || email,
    website: profile.website || websiteUrl,
    mainOffer:
      profile.mainOffer ||
      profile.services ||
      profile.businessDescription ||
      "AI-built offer based on your website",
  };

  const offerGoals = deriveOfferGoals(profile);
  completed.push("offer_goals");

  const launchPayload = buildAutoLaunchPayload(profile, offerGoals);

  const completion = await completeCommandCenterOnboardingAction(
    profile,
    offerGoals,
    launchPayload,
  ).catch((e) => ({
    success: false as const,
    error:
      e instanceof Error
        ? e.message
        : "AI setup could not be saved. Please try again.",
  }));

  if (!completion.success) {
    return {
      success: false as const,
      error: completion.error,
      progress: buildAiLaunchProgress(completed, {
        ...needsReview,
        launch_review: "Setup saved partially. Review and retry from the setup review page.",
      }),
    };
  }

  completed.push("website", "pipeline", "workflows", "ai_agents", "launch_review");

  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (business?.id) {
    const onboarding = createOnboardingRepository(supabase);
    const { data: existing } = await supabase
      .from("onboarding")
      .select("profile_data")
      .eq("user_id", user.id)
      .maybeSingle();
    const existingProfile =
      existing?.profile_data && typeof existing.profile_data === "object"
        ? (existing.profile_data as Record<string, unknown>)
        : {};
    await onboarding.upsertFull({
      userId: user.id,
      businessName: profile.businessName,
      ownerName:
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        "",
      email,
      phone: profile.phone,
      website: profile.website,
      serviceArea: profile.address,
      cityState: profile.address,
      services: profile.services,
      businessHours: profile.businessHours,
      monthlyBudget: parseCurrency(offerGoals.averageDealValue),
      stage: "live",
      status: "completed",
      profileData: {
        ...existingProfile,
        aiLaunchSetup: {
          mode: "automatic",
          websiteUrl,
          email,
          completedAt: new Date().toISOString(),
          progress: buildAiLaunchProgress(completed, needsReview),
          needsReview,
        },
      },
      checklist: {
        profile_complete: true,
        integrations_connected: false,
        agents_assigned: true,
        campaign_built: true,
        landing_page_ready: !needsReview.website,
        ai_active: true,
        team_invited: false,
      },
    });
  }

  try {
    await sendAiLaunchRegistrationEmail({
      to: email,
      businessName: profile.businessName,
      websiteUrl,
    });
  } catch {
    /* Email is helpful but should not block the completed AI setup. */
  }

  revalidatePath("/", "layout");
  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/launch-review");
  revalidatePath("/onboarding", "layout");

  return {
    success: true as const,
    redirectTo: PRODUCTION_LAUNCH_REVIEW_URL,
    progress: buildAiLaunchProgress(completed, needsReview),
  };
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
  return { success: true as const, redirectTo: PRODUCTION_LAUNCH_REVIEW_URL };
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
    redirectTo: PRODUCTION_LAUNCH_REVIEW_URL,
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
  redirect(PRODUCTION_LAUNCH_REVIEW_URL);
}
