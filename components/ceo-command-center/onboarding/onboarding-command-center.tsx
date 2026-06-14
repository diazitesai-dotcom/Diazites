"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Rocket,
  Scan,
  Sparkles,
} from "lucide-react";

import { OnboardingPipelineAiPanel } from "@/components/ceo-command-center/onboarding/onboarding-pipeline-ai-panel";
import { OnboardingPipelineTestPanel } from "@/components/ceo-command-center/onboarding/onboarding-pipeline-test-panel";
import { OnboardingStepAiAssistant } from "@/components/ceo-command-center/onboarding/onboarding-step-ai-assistant";
import { OnboardingZernioConnectCard } from "@/components/ceo-command-center/onboarding/onboarding-zernio-connect-card";
import { ProgressTracker } from "@/components/ceo-command-center/progress-tracker";
import { useBusinessWebsiteAutofill } from "@/components/ceo-command-center/onboarding/use-business-website-autofill";
import type { CommandCenterLaunchPayload } from "@/lib/onboarding/command-center-payload";
import { FIELD_LABELS } from "@/lib/ceo-command-center/business-profile-autofill";
import {
  BUSINESS_PROFILE_FIELD_KEYS,
  sanitizeBusinessProfile,
} from "@/lib/ceo-command-center/business-profile-utils";
import type {
  LandingPageCtaType,
  LandingPageDraft,
  LandingPageSettings,
} from "@/lib/ceo-command-center/landing-builder-types";
import { cn } from "@/lib/utils";
import { completeCommandCenterOnboardingAction } from "@/services/onboarding/actions";
import {
  draftAdsPlanWithAiAction,
  fillBusinessProfileWithAiAction,
  fillLandingPageWithAiAction,
  fillOfferGoalsWithAiAction,
  recommendAgentsWithAiAction,
  recommendConnectionsWithAiAction,
  recommendTrackingWithAiAction,
} from "@/actions/ceo-onboarding.actions";
import type {
  BusinessProfileFields,
  LandingPageOption,
  OfferGoalsFields,
  OnboardingCommandCenterData,
  OnboardingStepId,
} from "@/types/ceo-command-center";

type OnboardingCommandCenterProps = {
  initialData: OnboardingCommandCenterData;
};

type LandingBuilderTab = "templates" | "preview" | "edit" | "settings";

type PipelineBuilderTab = "stages" | "automation" | "follow_up" | "preview";

type PipelineWorkflowState = {
  pipelineType: string;
  leadOwner: string;
  responseSpeed: string;
  followUpStyle: string;
  followUpChannels: string[];
  qualificationQuestions: string;
  bookingAction: string;
  lostLeadRule: string;
  stages: string[];
  automations: Array<{ id: string; label: string; enabled: boolean }>;
  followUpMessages: {
    firstSms: string;
    firstEmail: string;
    voicemailScript: string;
    followUpEmail: string;
    finalReminder: string;
  };
};

const STEP_ORDER: OnboardingStepId[] = [
  "business_profile",
  "offer_goals",
  "landing_pages",
  "pipeline_workflow",
  "connect_accounts",
  "ai_agents",
  "ads_agent",
  "tracking",
  "pipeline_test",
  "launch",
];

const LANDING_BUILDER_TABS: Array<{ id: LandingBuilderTab; label: string }> = [
  { id: "templates", label: "Templates" },
  { id: "preview", label: "Preview" },
  { id: "edit", label: "Edit Sections" },
  { id: "settings", label: "Settings" },
];

const PIPELINE_BUILDER_TABS: Array<{ id: PipelineBuilderTab; label: string }> = [
  { id: "stages", label: "Pipeline Stages" },
  { id: "automation", label: "Automation" },
  { id: "follow_up", label: "Follow-Up" },
  { id: "preview", label: "Preview" },
];

const PRIMARY_GOAL_OPTIONS: Array<{ value: OfferGoalsFields["primaryGoal"]; label: string }> = [
  { value: "leads", label: "Generate leads" },
  { value: "phone_calls", label: "Get phone calls" },
  { value: "forms", label: "Get form submissions" },
  { value: "bookings", label: "Book appointments" },
  { value: "quote_requests", label: "Get quote requests" },
  { value: "sales", label: "Sell products or services" },
  { value: "revenue", label: "Hit a revenue target" },
  { value: "email_sms_list", label: "Grow email/SMS list" },
  { value: "donations_sponsors", label: "Get donations or sponsors" },
  { value: "program_enrollments", label: "Increase program enrollments" },
  { value: "local_visits", label: "Drive walk-ins / local visits" },
  { value: "customer_reactivation", label: "Reactivate past customers" },
];

const CONVERSION_ACTION_OPTIONS: Array<{
  value: OfferGoalsFields["preferredConversionAction"];
  label: string;
}> = [
  { value: "call", label: "Phone call" },
  { value: "form", label: "Form submission" },
  { value: "booking", label: "Booked appointment" },
  { value: "checkout", label: "Checkout / payment" },
  { value: "quote_request", label: "Quote request" },
  { value: "application", label: "Application" },
  { value: "email_signup", label: "Email signup" },
  { value: "sms_signup", label: "SMS signup" },
  { value: "whatsapp", label: "WhatsApp message" },
  { value: "live_chat", label: "Live chat" },
  { value: "donation", label: "Donation" },
  { value: "download", label: "Download / lead magnet" },
];

const OFFER_TYPE_OPTIONS: Array<{ value: OfferGoalsFields["offerType"]; label: string }> = [
  { value: "consultation", label: "Free consultation" },
  { value: "estimate", label: "Free estimate / quote" },
  { value: "paid_service", label: "Paid service" },
  { value: "product_purchase", label: "Product purchase" },
  { value: "appointment", label: "Appointment booking" },
  { value: "program_enrollment", label: "Program enrollment" },
  { value: "donation", label: "Donation / sponsorship" },
  { value: "trial_demo", label: "Trial / demo" },
  { value: "limited_offer", label: "Limited-time offer" },
  { value: "lead_magnet", label: "Lead magnet / download" },
];

const LANDING_TEMPLATE_METADATA: Record<
  LandingPageOption["type"],
  { bestFor: string; mainCta: string; sections: string[] }
> = {
  lead_gen: {
    bestFor: "Lead capture, quote requests, applications, and list growth",
    mainCta: "Submit form",
    sections: ["Hero", "Offer", "Benefits", "Lead form", "Testimonials", "FAQ"],
  },
  booking: {
    bestFor: "Consultations, inspections, appointments, and sales calls",
    mainCta: "Book appointment",
    sections: ["Hero", "Service details", "Calendar CTA", "Next steps", "Trust", "FAQ"],
  },
  special_offer: {
    bestFor: "Promotions, limited-time offers, launches, and paid campaigns",
    mainCta: "Claim offer",
    sections: ["Hero", "Urgency", "Offer details", "Proof", "CTA", "FAQ"],
  },
};

const FALLBACK_LANDING_PAGE: LandingPageOption = {
  id: "lead_gen",
  title: "Lead Generation Page",
  description: "Capture leads with a compelling offer and fast form.",
  type: "lead_gen",
};

const DEFAULT_PIPELINE_STAGES = [
  "New Lead",
  "Contacted",
  "Qualified",
  "Appointment Booked",
  "Proposal / Offer Sent",
  "Won",
  "Lost / Nurture",
];

const DEFAULT_AUTOMATION_ACTIONS = [
  "Create lead record",
  "Assign owner/agent",
  "Send confirmation email",
  "Send SMS follow-up",
  "Notify business owner",
  "Add to CRM/pipeline",
  "Trigger AI call or AI chat follow-up",
  "Create task if no response",
];

const FOLLOW_UP_STYLE_OPTIONS = [
  "Fast response",
  "Standard",
  "Long nurture",
  "Missed call recovery",
  "No-show recovery",
  "Quote follow-up",
  "Abandoned form follow-up",
];

const FOLLOW_UP_CHANNEL_OPTIONS = ["SMS", "Email", "Call", "WhatsApp"];

const PIPELINE_TYPE_OPTIONS = ["Sales", "Booking", "Donation", "Enrollment", "Support"];

const formatOptionLabel = <T extends string>(
  options: Array<{ value: T; label: string }>,
  value: T,
) => options.find((option) => option.value === value)?.label ?? value;

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function getDefaultCtaType(
  preferredConversionAction: OfferGoalsFields["preferredConversionAction"],
): LandingPageCtaType {
  if (
    preferredConversionAction === "call" ||
    preferredConversionAction === "booking" ||
    preferredConversionAction === "checkout"
  ) {
    return preferredConversionAction;
  }
  return "form";
}

function getDefaultButtonText(ctaType: LandingPageCtaType) {
  if (ctaType === "call") return "Call Now";
  if (ctaType === "booking") return "Book Appointment";
  if (ctaType === "checkout") return "Get Started";
  return "Submit Request";
}

function createLandingPageDraft(
  page: LandingPageOption,
  profile: BusinessProfileFields,
  offerGoals: OfferGoalsFields,
): LandingPageDraft {
  const businessName = profile.businessName || "Your Business";
  const targetCustomer = profile.targetCustomer || "your ideal customers";
  const offer = profile.mainOffer || page.title;
  const conversion = formatOptionLabel(
    CONVERSION_ACTION_OPTIONS,
    offerGoals.preferredConversionAction,
  ).toLowerCase();

  return {
    heroHeadline: `${businessName}: ${offer}`,
    subheadline: `A focused ${page.title.toLowerCase()} built to help ${targetCustomer} take action.`,
    ctaText: getDefaultButtonText(getDefaultCtaType(offerGoals.preferredConversionAction)),
    offerDetails: `${offer} positioned as a ${formatOptionLabel(
      OFFER_TYPE_OPTIONS,
      offerGoals.offerType,
    ).toLowerCase()} for ${targetCustomer}.`,
    benefits: "Clear offer\nFast follow-up\nSimple next step\nBuilt for measurable conversions",
    formFields:
      page.type === "booking"
        ? "Name\nEmail\nPhone\nPreferred appointment time"
        : "Name\nEmail\nPhone\nWhat do you need help with?",
    socialProof: "Trusted by customers who want a clear path from interest to action.",
    faq: `What happens after I ${conversion}?\nHow soon will someone follow up?\nWho is this best for?`,
    thankYouMessage: "Thanks. Your request was received and the team will follow up shortly.",
  };
}

function createLandingPageSettings(
  page: LandingPageOption,
  profile: BusinessProfileFields,
  offerGoals: OfferGoalsFields,
): LandingPageSettings {
  const ctaType = getDefaultCtaType(offerGoals.preferredConversionAction);
  const baseSlug = slugify(profile.businessName || page.title) || page.id;

  return {
    ctaType,
    buttonText: getDefaultButtonText(ctaType),
    pageSlug: `${baseSlug}-${page.type.replace(/_/g, "-")}`,
    trackingEvent: `${page.type}_conversion`,
    thankYouRedirect: "/thank-you",
    brandTone: "Professional, helpful, conversion-focused",
  };
}

function createPipelineWorkflowState(
  profile: BusinessProfileFields,
  offerGoals: OfferGoalsFields,
): PipelineWorkflowState {
  const conversion = formatOptionLabel(
    CONVERSION_ACTION_OPTIONS,
    offerGoals.preferredConversionAction,
  ).toLowerCase();
  const offer = profile.mainOffer || "your offer";

  return {
    pipelineType: "Sales",
    leadOwner: "AI agent + business owner",
    responseSpeed: "Instant response, then 5-minute follow-up",
    followUpStyle: "Fast response",
    followUpChannels: ["SMS", "Email", "Call"],
    qualificationQuestions:
      "What service are you interested in?\nWhat is your timeline?\nWhat is the best way to reach you?",
    bookingAction: `Move qualified leads to Appointment Booked after the ${conversion}.`,
    lostLeadRule: "Move unresponsive leads to Lost / Nurture after 7 days and keep weekly follow-up active.",
    stages: DEFAULT_PIPELINE_STAGES,
    automations: DEFAULT_AUTOMATION_ACTIONS.map((label) => ({
      id: slugify(label),
      label,
      enabled: true,
    })),
    followUpMessages: {
      firstSms: `Thanks for your interest in ${offer}. We received your request and will follow up shortly.`,
      firstEmail: `Thanks for reaching out. Here is what happens next for ${offer}.`,
      voicemailScript:
        "Hi, this is the Diazites AI assistant calling about your request. We wanted to help you take the next step.",
      followUpEmail: "Just checking in to see if you still want help with your request.",
      finalReminder:
        "Last reminder for now. Reply when you are ready and we will reopen your request.",
    },
  };
}

function stepToProgressStatus(
  stepId: OnboardingStepId,
  currentIndex: number,
  stepIndex: number,
): "completed" | "active" | "review" | "pending" {
  if (stepIndex < currentIndex) return "completed";
  if (stepIndex === currentIndex) {
    return stepId === "pipeline_test" ? "review" : "active";
  }
  return "pending";
}

export function OnboardingCommandCenter({ initialData }: OnboardingCommandCenterProps) {
  const router = useRouter();
  const initialLandingPage = initialData.landingPages[0] ?? FALLBACK_LANDING_PAGE;
  const [currentStepId, setCurrentStepId] = useState<OnboardingStepId>(
    initialData.currentStepId,
  );
  const {
    websiteUrl,
    setWebsiteUrl,
    profile,
    setProfile,
    isScanning,
    scanError,
    scanMessage,
    scanNow,
    handleWebsiteBlur,
  } = useBusinessWebsiteAutofill(
    initialData.businessProfile.website || "",
    initialData.businessProfile,
  );
  const [offerGoals, setOfferGoals] = useState<OfferGoalsFields>(initialData.offerGoals);
  const [selectedLandingId, setSelectedLandingId] = useState<string | null>(
    initialLandingPage.id,
  );
  const [landingBuilderTab, setLandingBuilderTab] =
    useState<LandingBuilderTab>("templates");
  const [landingPageDraft, setLandingPageDraft] = useState<LandingPageDraft>(() =>
    createLandingPageDraft(initialLandingPage, initialData.businessProfile, initialData.offerGoals),
  );
  const [landingPageSettings, setLandingPageSettings] = useState<LandingPageSettings>(() =>
    createLandingPageSettings(
      initialLandingPage,
      initialData.businessProfile,
      initialData.offerGoals,
    ),
  );
  const [pipelineBuilderTab, setPipelineBuilderTab] =
    useState<PipelineBuilderTab>("stages");
  const [pipelineWorkflow, setPipelineWorkflow] = useState<PipelineWorkflowState>(() =>
    createPipelineWorkflowState(initialData.businessProfile, initialData.offerGoals),
  );
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [zernioApiKey, setZernioApiKey] = useState("");
  const [pipelineTestPassed, setPipelineTestPassed] = useState(false);

  const [integrations, setIntegrations] = useState(initialData.integrations);

  const [profileAiPending, startProfileAi] = useTransition();
  const [profileAiError, setProfileAiError] = useState<string | null>(null);
  const [profileAiMessage, setProfileAiMessage] = useState<string | null>(null);

  const [offerAiPending, startOfferAi] = useTransition();
  const [offerAiError, setOfferAiError] = useState<string | null>(null);
  const [offerAiMessage, setOfferAiMessage] = useState<string | null>(null);

  const [landingAiPending, startLandingAi] = useTransition();
  const [landingAiError, setLandingAiError] = useState<string | null>(null);
  const [landingAiMessage, setLandingAiMessage] = useState<string | null>(null);

  const runProfileAi = (instruction: string) => {
    startProfileAi(async () => {
      setProfileAiError(null);
      setProfileAiMessage(null);
      const result = await fillBusinessProfileWithAiAction({ instruction, profile });
      if (!result.success) {
        setProfileAiError(result.error);
        return;
      }
      setProfile((prev) => sanitizeBusinessProfile({ ...prev, ...result.data.patch }));
      setProfileAiMessage(result.data.summary);
    });
  };

  const runOfferGoalsAi = (instruction: string) => {
    startOfferAi(async () => {
      setOfferAiError(null);
      setOfferAiMessage(null);
      const result = await fillOfferGoalsWithAiAction({ instruction, profile, offerGoals });
      if (!result.success) {
        setOfferAiError(result.error);
        return;
      }
      setOfferGoals((prev) => ({ ...prev, ...result.data.patch }));
      setOfferAiMessage(result.data.summary);
    });
  };

  const runLandingAi = (instruction: string) => {
    startLandingAi(async () => {
      setLandingAiError(null);
      setLandingAiMessage(null);
      const result = await fillLandingPageWithAiAction({
        instruction,
        profile,
        offerGoals,
        draft: landingPageDraft,
        settings: landingPageSettings,
      });
      if (!result.success) {
        setLandingAiError(result.error);
        return;
      }
      setLandingPageDraft((prev) => ({ ...prev, ...result.data.draftPatch }));
      setLandingPageSettings((prev) => ({ ...prev, ...result.data.settingsPatch }));
      setLandingAiMessage(result.data.summary);
      setLandingBuilderTab("edit");
    });
  };

  const [connectAiPending, startConnectAi] = useTransition();
  const [connectAiError, setConnectAiError] = useState<string | null>(null);
  const [connectAiMessage, setConnectAiMessage] = useState<string | null>(null);

  const [agentsAiPending, startAgentsAi] = useTransition();
  const [agentsAiError, setAgentsAiError] = useState<string | null>(null);
  const [agentsAiMessage, setAgentsAiMessage] = useState<string | null>(null);

  const [adsAiPending, startAdsAi] = useTransition();
  const [adsAiError, setAdsAiError] = useState<string | null>(null);
  const [adsAiMessage, setAdsAiMessage] = useState<string | null>(null);

  const [trackingAiPending, startTrackingAi] = useTransition();
  const [trackingAiError, setTrackingAiError] = useState<string | null>(null);
  const [trackingAiMessage, setTrackingAiMessage] = useState<string | null>(null);

  const runConnectAi = (instruction: string) => {
    startConnectAi(async () => {
      setConnectAiError(null);
      setConnectAiMessage(null);
      const result = await recommendConnectionsWithAiAction({
        instruction,
        profile,
        offerGoals,
        integrations: integrations.map((item) => ({ id: item.id, name: item.name })),
      });
      if (!result.success) {
        setConnectAiError(result.error);
        return;
      }
      const recommended = new Set(result.data.recommendedIntegrationIds);
      if (recommended.size > 0) {
        setIntegrations((prev) =>
          prev.map((item) =>
            recommended.has(item.id) ? { ...item, connected: true } : item,
          ),
        );
      }
      setConnectAiMessage(result.data.summary);
    });
  };

  const runAgentsAi = (instruction: string) => {
    startAgentsAi(async () => {
      setAgentsAiError(null);
      setAgentsAiMessage(null);
      const result = await recommendAgentsWithAiAction({ instruction, profile, offerGoals });
      if (!result.success) {
        setAgentsAiError(result.error);
        return;
      }
      const agents = result.data.recommendedAgents;
      setAgentsAiMessage(
        agents.length > 0
          ? `${result.data.summary} Recommended: ${agents.join(", ")}.`
          : result.data.summary,
      );
    });
  };

  const runAdsAi = (instruction: string) => {
    startAdsAi(async () => {
      setAdsAiError(null);
      setAdsAiMessage(null);
      const result = await draftAdsPlanWithAiAction({ instruction, profile, offerGoals });
      if (!result.success) {
        setAdsAiError(result.error);
        return;
      }
      setAdsAiMessage(result.data.summary);
    });
  };

  const runTrackingAi = (instruction: string) => {
    startTrackingAi(async () => {
      setTrackingAiError(null);
      setTrackingAiMessage(null);
      const result = await recommendTrackingWithAiAction({ instruction, profile });
      if (!result.success) {
        setTrackingAiError(result.error);
        return;
      }
      const platforms = result.data.recommendedTrackingPlatforms;
      setTrackingAiMessage(
        platforms.length > 0
          ? `${result.data.summary} Recommended: ${platforms.join(", ")}.`
          : result.data.summary,
      );
    });
  };

  const currentIndex = STEP_ORDER.indexOf(currentStepId);
  const selectedLandingPage =
    initialData.landingPages.find((page) => page.id === selectedLandingId) ?? initialLandingPage;
  const progressSteps = initialData.steps.map((step, index) => ({
    id: step.number,
    label: step.label,
    status: stepToProgressStatus(step.id, currentIndex, index),
  }));

  const goNext = () => {
    const next = STEP_ORDER[currentIndex + 1];
    if (next === "launch" && !pipelineTestPassed) {
      setLaunchError("Run the pipeline test before launching your system.");
      setCurrentStepId("pipeline_test");
      return;
    }
    if (next) setCurrentStepId(next);
  };

  const goPrev = () => {
    const prev = STEP_ORDER[currentIndex - 1];
    if (prev) setCurrentStepId(prev);
  };

  const goToStepNumber = (stepNumber: number) => {
    const step = initialData.steps.find((item) => item.number === stepNumber);
    if (step) setCurrentStepId(step.id);
  };

  const handleLaunch = async () => {
    if (!pipelineTestPassed) {
      setLaunchError("Run the pipeline test on step 9 before launching.");
      setCurrentStepId("pipeline_test");
      return;
    }

    setIsLaunching(true);
    setLaunchError(null);

    const launchPayload: CommandCenterLaunchPayload = {
      landingTemplateId: selectedLandingId ?? FALLBACK_LANDING_PAGE.id,
      landingDraft: landingPageDraft,
      landingSettings: landingPageSettings,
      logoUrl,
      pipelineWorkflow,
      zernioApiKey: zernioApiKey.trim() || null,
      pipelineTestPassed,
    };

    try {
      const result = await completeCommandCenterOnboardingAction(
        profile,
        offerGoals,
        launchPayload,
      );
      if (!result.success) {
        setLaunchError(result.error);
        return;
      }

      router.push(result.redirectTo);
      router.refresh();
    } catch (error) {
      setLaunchError(error instanceof Error ? error.message : "Could not complete onboarding.");
    } finally {
      setIsLaunching(false);
    }
  };

  const toggleIntegration = (id: string) => {
    setIntegrations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, connected: !item.connected } : item)),
    );
  };

  const updateOfferGoals = <Key extends keyof OfferGoalsFields>(
    key: Key,
    value: OfferGoalsFields[Key],
  ) => {
    setOfferGoals((current) => ({ ...current, [key]: value }));
  };

  const handleLandingTemplateAction = (page: LandingPageOption, tab: LandingBuilderTab) => {
    setSelectedLandingId(page.id);
    setLandingBuilderTab(tab);
    setLandingPageDraft(createLandingPageDraft(page, profile, offerGoals));
    setLandingPageSettings(createLandingPageSettings(page, profile, offerGoals));
  };

  const updateLandingPageDraft = <Key extends keyof LandingPageDraft>(
    key: Key,
    value: LandingPageDraft[Key],
  ) => {
    setLandingPageDraft((current) => ({ ...current, [key]: value }));
  };

  const updateLandingPageSettings = <Key extends keyof LandingPageSettings>(
    key: Key,
    value: LandingPageSettings[Key],
  ) => {
    setLandingPageSettings((current) => ({ ...current, [key]: value }));
  };

  const updatePipelineWorkflow = <Key extends keyof PipelineWorkflowState>(
    key: Key,
    value: PipelineWorkflowState[Key],
  ) => {
    setPipelineWorkflow((current) => ({ ...current, [key]: value }));
  };

  const updatePipelineStage = (index: number, value: string) => {
    setPipelineWorkflow((current) => ({
      ...current,
      stages: current.stages.map((stage, stageIndex) => (stageIndex === index ? value : stage)),
    }));
  };

  const addPipelineStage = () => {
    setPipelineWorkflow((current) => ({
      ...current,
      stages: [...current.stages, `New Stage ${current.stages.length + 1}`],
    }));
  };

  const removePipelineStage = (index: number) => {
    setPipelineWorkflow((current) => ({
      ...current,
      stages: current.stages.filter((_, stageIndex) => stageIndex !== index),
    }));
  };

  const toggleAutomation = (id: string) => {
    setPipelineWorkflow((current) => ({
      ...current,
      automations: current.automations.map((automation) =>
        automation.id === id ? { ...automation, enabled: !automation.enabled } : automation,
      ),
    }));
  };

  const toggleFollowUpChannel = (channel: string) => {
    setPipelineWorkflow((current) => ({
      ...current,
      followUpChannels: current.followUpChannels.includes(channel)
        ? current.followUpChannels.filter((item) => item !== channel)
        : [...current.followUpChannels, channel],
    }));
  };

  const updateFollowUpMessage = (
    key: keyof PipelineWorkflowState["followUpMessages"],
    value: string,
  ) => {
    setPipelineWorkflow((current) => ({
      ...current,
      followUpMessages: { ...current.followUpMessages, [key]: value },
    }));
  };

  return (
    <div className="min-h-screen bg-[#050810] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.15),transparent)]" />

      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-bold tracking-[0.2em] text-white">DIAZITES</p>
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-violet-400/90">
              AI Business OS
            </p>
            <h1 className="mt-4 text-2xl font-semibold text-white">Onboarding Command Center</h1>
            <p className="mt-1 text-sm text-slate-400">
              Set up your AI business system in 10 guided steps.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-violet-300 hover:text-violet-200"
          >
            Skip to dashboard →
          </Link>
        </header>

        <ProgressTracker steps={progressSteps} onStepClick={(step) => goToStepNumber(step.id)} />

        <div className="mt-8 rounded-2xl border border-white/[0.08] bg-[#0c1222]/80 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          {currentStepId === "business_profile" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Business Profile</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Paste your website URL — fields auto-fill as soon as we detect a valid link.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  onBlur={handleWebsiteBlur}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      scanNow();
                    }
                  }}
                  placeholder="https://yourbusiness.com"
                  className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
                />
                <button
                  type="button"
                  onClick={scanNow}
                  disabled={isScanning || !websiteUrl.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Scanning…
                    </>
                  ) : (
                    <>
                      <Scan className="h-4 w-4" />
                      Scan Business
                    </>
                  )}
                </button>
              </div>
              {isScanning ? (
                <p className="text-sm text-violet-300">Analyzing website and filling your profile…</p>
              ) : null}
              {scanError ? (
                <p role="alert" className="text-sm text-rose-300">
                  {scanError}
                </p>
              ) : null}
              {scanMessage ? (
                <p role="status" className="text-sm text-emerald-300">
                  {scanMessage}
                </p>
              ) : null}
              <OnboardingStepAiAssistant
                title="Optional: let AI help fill this out"
                description="Describe your business in plain language and AI will fill in the fields below — you can still edit anything."
                placeholder='e.g. "We are a youth mentoring nonprofit in Houston offering after-school programs and reentry support."'
                suggestions={[
                  "Fill this in for a youth mentoring nonprofit in Houston",
                  "Write an SEO meta title and description",
                  "Describe my ideal customer",
                ]}
                pending={profileAiPending}
                error={profileAiError}
                message={profileAiMessage}
                onRun={runProfileAi}
              />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {BUSINESS_PROFILE_FIELD_KEYS.map((key) => (
                  <label key={key} className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-400">
                      {FIELD_LABELS[key]}
                    </span>
                    <input
                      value={profile[key]}
                      onChange={(e) =>
                        setProfile((p) => sanitizeBusinessProfile({ ...p, [key]: e.target.value }))
                      }
                      disabled={isScanning}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white focus:border-violet-500/40 focus:outline-none disabled:opacity-60"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {currentStepId === "offer_goals" && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-white">Offer & Goals</h2>
              <p className="text-sm text-slate-400">
                Define the offer, business outcome, and conversion action the AI system should
                build around.
              </p>
              <OnboardingStepAiAssistant
                title="Optional: let AI help fill this out"
                description="Describe your goal in plain language and AI will set the offer type, primary goal, conversion action, and targets."
                placeholder='e.g. "I want about 100 leads a month through a form, average job is around $500."'
                suggestions={[
                  "My goal is 100 leads/month through a form",
                  "Set a revenue target of $50k/month",
                  "We want booked appointments for consultations",
                ]}
                pending={offerAiPending}
                error={offerAiError}
                message={offerAiMessage}
                onRun={runOfferGoalsAi}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block md:col-span-2">
                  <span className="mb-1 block text-xs text-slate-400">Main Offer</span>
                  <textarea
                    value={profile.mainOffer}
                    rows={3}
                    onChange={(e) =>
                      setProfile((p) => sanitizeBusinessProfile({ ...p, mainOffer: e.target.value }))
                    }
                    placeholder="Describe the offer prospects will see, e.g. free consultation, quote, audit, program enrollment..."
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-400">Offer Type</span>
                  <select
                    value={offerGoals.offerType}
                    onChange={(e) =>
                      updateOfferGoals("offerType", e.target.value as OfferGoalsFields["offerType"])
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
                  >
                    {OFFER_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value} className="bg-[#0c1222]">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-400">Primary Goal</span>
                  <select
                    value={offerGoals.primaryGoal}
                    onChange={(e) =>
                      updateOfferGoals(
                        "primaryGoal",
                        e.target.value as OfferGoalsFields["primaryGoal"],
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
                  >
                    {PRIMARY_GOAL_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value} className="bg-[#0c1222]">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-400">Preferred Conversion</span>
                  <select
                    value={offerGoals.preferredConversionAction}
                    onChange={(e) =>
                      updateOfferGoals(
                        "preferredConversionAction",
                        e.target.value as OfferGoalsFields["preferredConversionAction"],
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
                  >
                    {CONVERSION_ACTION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value} className="bg-[#0c1222]">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-400">Monthly Target</span>
                  <input
                    value={offerGoals.monthlyTarget}
                    onChange={(e) => updateOfferGoals("monthlyTarget", e.target.value)}
                    placeholder="100 leads, 40 calls, $50,000 revenue..."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-400">Average Deal Value</span>
                  <input
                    value={offerGoals.averageDealValue}
                    onChange={(e) => updateOfferGoals("averageDealValue", e.target.value)}
                    placeholder="$500"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
                  />
                </label>
              </div>
              <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4 text-sm text-violet-100">
                <p className="font-medium">Agent build instruction</p>
                <p className="mt-1 text-xs leading-5 text-violet-100/80">
                  Build a{" "}
                  {formatOptionLabel(OFFER_TYPE_OPTIONS, offerGoals.offerType).toLowerCase()}{" "}
                  funnel to{" "}
                  {formatOptionLabel(PRIMARY_GOAL_OPTIONS, offerGoals.primaryGoal).toLowerCase()},
                  using{" "}
                  {formatOptionLabel(
                    CONVERSION_ACTION_OPTIONS,
                    offerGoals.preferredConversionAction,
                  ).toLowerCase()}{" "}
                  as the main conversion event and {offerGoals.monthlyTarget} as the monthly target.
                </p>
              </div>
            </div>
          )}

          {currentStepId === "landing_pages" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-white">Landing Page Builder</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Choose a landing page template, preview the page, and edit each section before
                  the AI system builds your funnel.
                </p>
              </div>

              <OnboardingStepAiAssistant
                title="Optional: let AI build this landing page"
                description="Describe the page or tone you want and AI will write the hero, benefits, FAQ, settings, and more — then open the Edit Sections tab."
                placeholder='e.g. "Write a warm, community-focused page for our after-school program with 3 benefits and an FAQ."'
                suggestions={[
                  "Write a hero headline and 3 benefits for my offer",
                  "Make the tone warm and community-focused",
                  "Draft an FAQ and thank-you message",
                ]}
                pending={landingAiPending}
                error={landingAiError}
                message={landingAiMessage}
                onRun={runLandingAi}
              />

              <div className="flex flex-wrap gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-2">
                {LANDING_BUILDER_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setLandingBuilderTab(tab.id)}
                    className={cn(
                      "rounded-xl px-3 py-2 text-xs font-medium transition",
                      landingBuilderTab === tab.id
                        ? "bg-violet-600/30 text-violet-100"
                        : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200",
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {landingBuilderTab === "templates" && (
                <div className="grid gap-4 md:grid-cols-3">
                  {initialData.landingPages.map((page) => {
                    const metadata = LANDING_TEMPLATE_METADATA[page.type];

                    return (
                      <article
                        key={page.id}
                        className={cn(
                          "rounded-2xl border p-4 transition",
                          selectedLandingId === page.id
                            ? "border-violet-500/50 bg-violet-500/10"
                            : "border-white/[0.08] bg-white/[0.02]",
                        )}
                      >
                        <h3 className="font-semibold text-white">{page.title}</h3>
                        <p className="mt-2 text-xs text-slate-400">{page.description}</p>
                        <div className="mt-4 space-y-2 text-xs text-slate-400">
                          <p>
                            <span className="font-medium text-slate-300">Best for:</span>{" "}
                            {metadata.bestFor}
                          </p>
                          <p>
                            <span className="font-medium text-slate-300">Main CTA:</span>{" "}
                            {metadata.mainCta}
                          </p>
                          <p>
                            <span className="font-medium text-slate-300">Sections:</span>{" "}
                            {metadata.sections.join(", ")}
                          </p>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleLandingTemplateAction(page, "preview")}
                            className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-slate-300"
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLandingTemplateAction(page, "edit")}
                            className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-slate-300"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLandingTemplateAction(page, "templates")}
                            className="rounded-lg bg-violet-600/30 px-2.5 py-1 text-xs font-medium text-violet-100"
                          >
                            Select
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {landingBuilderTab === "preview" && (
                <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
                  <article className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                    <div className="bg-gradient-to-br from-violet-600/25 to-indigo-600/10 p-6">
                      <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-200">
                        {selectedLandingPage.title}
                      </p>
                      <h3 className="mt-3 text-2xl font-semibold text-white">
                        {landingPageDraft.heroHeadline}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-slate-300">
                        {landingPageDraft.subheadline}
                      </p>
                      <button
                        type="button"
                        className="mt-5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
                      >
                        {landingPageDraft.ctaText}
                      </button>
                    </div>
                    <div className="grid gap-4 p-5 md:grid-cols-2">
                      <div className="rounded-xl border border-white/[0.06] bg-[#0c1222]/80 p-4">
                        <p className="text-xs font-medium text-slate-400">Offer</p>
                        <p className="mt-2 text-sm text-white">{landingPageDraft.offerDetails}</p>
                      </div>
                      <div className="rounded-xl border border-white/[0.06] bg-[#0c1222]/80 p-4">
                        <p className="text-xs font-medium text-slate-400">Benefits</p>
                        <ul className="mt-2 space-y-1 text-sm text-white">
                          {landingPageDraft.benefits.split("\n").map((benefit) => (
                            <li key={benefit}>• {benefit}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-xl border border-white/[0.06] bg-[#0c1222]/80 p-4">
                        <p className="text-xs font-medium text-slate-400">
                          {selectedLandingPage.type === "booking"
                            ? "Booking block"
                            : selectedLandingPage.type === "special_offer"
                              ? "Offer block"
                              : "Lead form"}
                        </p>
                        <p className="mt-2 text-sm text-white">
                          {landingPageDraft.formFields.split("\n").join(" • ")}
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/[0.06] bg-[#0c1222]/80 p-4">
                        <p className="text-xs font-medium text-slate-400">Trust</p>
                        <p className="mt-2 text-sm text-white">{landingPageDraft.socialProof}</p>
                      </div>
                      <div className="rounded-xl border border-white/[0.06] bg-[#0c1222]/80 p-4 md:col-span-2">
                        <p className="text-xs font-medium text-slate-400">FAQ</p>
                        <p className="mt-2 whitespace-pre-line text-sm text-white">
                          {landingPageDraft.faq}
                        </p>
                      </div>
                    </div>
                  </article>
                  <aside className="space-y-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
                    <p className="text-sm font-semibold text-white">Selected template</p>
                    <p className="text-xs text-slate-400">{selectedLandingPage.description}</p>
                    <div className="space-y-2 text-xs text-slate-400">
                      <p>
                        <span className="text-slate-300">Offer type:</span>{" "}
                        {formatOptionLabel(OFFER_TYPE_OPTIONS, offerGoals.offerType)}
                      </p>
                      <p>
                        <span className="text-slate-300">Goal:</span>{" "}
                        {formatOptionLabel(PRIMARY_GOAL_OPTIONS, offerGoals.primaryGoal)}
                      </p>
                      <p>
                        <span className="text-slate-300">Conversion:</span>{" "}
                        {formatOptionLabel(
                          CONVERSION_ACTION_OPTIONS,
                          offerGoals.preferredConversionAction,
                        )}
                      </p>
                    </div>
                  </aside>
                </div>
              )}

              {landingBuilderTab === "edit" && (
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    ["heroHeadline", "Hero headline"],
                    ["subheadline", "Subheadline"],
                    ["ctaText", "CTA text"],
                    ["offerDetails", "Offer details"],
                    ["benefits", "Benefits"],
                    ["formFields", "Form fields"],
                    ["socialProof", "Social proof / testimonials"],
                    ["faq", "FAQ"],
                    ["thankYouMessage", "Thank-you message"],
                  ].map(([key, label]) => (
                    <label key={key} className={cn("block", key === "offerDetails" && "md:col-span-2")}>
                      <span className="mb-1 block text-xs text-slate-400">{label}</span>
                      <textarea
                        value={landingPageDraft[key as keyof LandingPageDraft]}
                        rows={key === "offerDetails" ? 3 : 2}
                        onChange={(e) =>
                          updateLandingPageDraft(
                            key as keyof LandingPageDraft,
                            e.target.value,
                          )
                        }
                        className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
                      />
                    </label>
                  ))}
                </div>
              )}

              {landingBuilderTab === "settings" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block md:col-span-2">
                    <span className="mb-1 block text-xs text-slate-400">Business logo</span>
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 512_000) {
                            setLaunchError("Logo must be under 512 KB.");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === "string") setLogoUrl(reader.result);
                          };
                          reader.readAsDataURL(file);
                        }}
                        className="text-xs text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-600/30 file:px-3 file:py-2 file:text-xs file:text-violet-100"
                      />
                      <input
                        type="url"
                        placeholder="Or paste logo URL (https://…)"
                        value={logoUrl?.startsWith("data:") ? "" : logoUrl ?? ""}
                        onChange={(e) => setLogoUrl(e.target.value.trim() || null)}
                        className="min-w-[200px] flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
                      />
                      {logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={logoUrl}
                          alt="Logo preview"
                          className="h-10 w-10 rounded-lg border border-white/10 object-contain"
                        />
                      ) : null}
                    </div>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs text-slate-400">CTA Type</span>
                    <select
                      value={landingPageSettings.ctaType}
                      onChange={(e) => {
                        const nextCta = e.target.value as LandingPageCtaType;
                        updateLandingPageSettings("ctaType", nextCta);
                        updateLandingPageSettings("buttonText", getDefaultButtonText(nextCta));
                      }}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
                    >
                      {["call", "form", "booking", "checkout"].map((option) => (
                        <option key={option} value={option} className="bg-[#0c1222]">
                          {option.replace(/^\w/, (char) => char.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  </label>
                  {[
                    ["buttonText", "Button text"],
                    ["pageSlug", "Page slug"],
                    ["trackingEvent", "Tracking event"],
                    ["thankYouRedirect", "Thank-you redirect"],
                    ["brandTone", "Brand tone"],
                  ].map(([key, label]) => (
                    <label key={key} className="block">
                      <span className="mb-1 block text-xs text-slate-400">{label}</span>
                      <input
                        value={landingPageSettings[key as keyof LandingPageSettings]}
                        onChange={(e) =>
                          updateLandingPageSettings(
                            key as keyof LandingPageSettings,
                            e.target.value,
                          )
                        }
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
                      />
                    </label>
                  ))}
                  <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4 text-sm text-violet-100 md:col-span-2">
                    <p className="font-medium">Tracking setup</p>
                    <p className="mt-1 text-xs leading-5 text-violet-100/80">
                      Track {landingPageSettings.trackingEvent} when visitors complete the{" "}
                      {landingPageSettings.ctaType} CTA, then send them to{" "}
                      {landingPageSettings.thankYouRedirect}.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStepId === "pipeline_workflow" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-white">Pipeline & Workflow Builder</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Design how new leads move from first contact to booked, followed up, and closed.
                </p>
              </div>

              <OnboardingPipelineAiPanel
                profile={profile}
                offerGoals={offerGoals}
                pipelineWorkflow={pipelineWorkflow}
                onApply={(next) => {
                  setPipelineWorkflow(next);
                  setPipelineTestPassed(false);
                }}
              />

              <div className="flex flex-wrap gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-2">
                {PIPELINE_BUILDER_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPipelineBuilderTab(tab.id)}
                    className={cn(
                      "rounded-xl px-3 py-2 text-xs font-medium transition",
                      pipelineBuilderTab === tab.id
                        ? "bg-violet-600/30 text-violet-100"
                        : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200",
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {pipelineBuilderTab === "stages" && (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <label className="block">
                      <span className="mb-1 block text-xs text-slate-400">Pipeline Type</span>
                      <select
                        value={pipelineWorkflow.pipelineType}
                        onChange={(e) => updatePipelineWorkflow("pipelineType", e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
                      >
                        {PIPELINE_TYPE_OPTIONS.map((option) => (
                          <option key={option} value={option} className="bg-[#0c1222]">
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs text-slate-400">Lead Owner</span>
                      <input
                        value={pipelineWorkflow.leadOwner}
                        onChange={(e) => updatePipelineWorkflow("leadOwner", e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs text-slate-400">Response Speed Goal</span>
                      <input
                        value={pipelineWorkflow.responseSpeed}
                        onChange={(e) => updatePipelineWorkflow("responseSpeed", e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
                      />
                    </label>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {pipelineWorkflow.stages.map((stage, index) => (
                      <div
                        key={`${stage}-${index}`}
                        className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-xs font-semibold text-violet-200">
                          {index + 1}
                        </span>
                        <input
                          value={stage}
                          onChange={(e) => updatePipelineStage(index, e.target.value)}
                          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
                        />
                        {pipelineWorkflow.stages.length > 3 ? (
                          <button
                            type="button"
                            onClick={() => removePipelineStage(index)}
                            className="rounded-lg border border-white/10 px-2.5 py-2 text-xs text-slate-400 hover:text-rose-200"
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addPipelineStage}
                    className="rounded-xl bg-violet-600/30 px-4 py-2 text-sm font-medium text-violet-100"
                  >
                    Add Stage
                  </button>
                </div>
              )}

              {pipelineBuilderTab === "automation" && (
                <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {pipelineWorkflow.automations.map((automation) => (
                      <button
                        key={automation.id}
                        type="button"
                        onClick={() => toggleAutomation(automation.id)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border p-4 text-left transition",
                          automation.enabled
                            ? "border-violet-500/40 bg-violet-500/10"
                            : "border-white/[0.08] bg-white/[0.02]",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                            automation.enabled
                              ? "border-violet-400 bg-violet-500 text-white"
                              : "border-white/20 text-transparent",
                          )}
                        >
                          <Check className="h-3 w-3" />
                        </span>
                        <span className="text-sm text-white">{automation.label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="space-y-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
                    <label className="block">
                      <span className="mb-1 block text-xs text-slate-400">Qualification Questions</span>
                      <textarea
                        value={pipelineWorkflow.qualificationQuestions}
                        rows={5}
                        onChange={(e) =>
                          updatePipelineWorkflow("qualificationQuestions", e.target.value)
                        }
                        className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs text-slate-400">Booking Action</span>
                      <textarea
                        value={pipelineWorkflow.bookingAction}
                        rows={3}
                        onChange={(e) => updatePipelineWorkflow("bookingAction", e.target.value)}
                        className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
                      />
                    </label>
                  </div>
                </div>
              )}

              {pipelineBuilderTab === "follow_up" && (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-xs text-slate-400">Follow-Up Style</span>
                      <select
                        value={pipelineWorkflow.followUpStyle}
                        onChange={(e) => updatePipelineWorkflow("followUpStyle", e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
                      >
                        {FOLLOW_UP_STYLE_OPTIONS.map((option) => (
                          <option key={option} value={option} className="bg-[#0c1222]">
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs text-slate-400">Lost Lead / Nurture Rule</span>
                      <input
                        value={pipelineWorkflow.lostLeadRule}
                        onChange={(e) => updatePipelineWorkflow("lostLeadRule", e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {FOLLOW_UP_CHANNEL_OPTIONS.map((channel) => {
                      const selected = pipelineWorkflow.followUpChannels.includes(channel);

                      return (
                        <button
                          key={channel}
                          type="button"
                          onClick={() => toggleFollowUpChannel(channel)}
                          className={cn(
                            "rounded-xl border px-3 py-2 text-xs font-medium transition",
                            selected
                              ? "border-violet-500/50 bg-violet-500/15 text-violet-100"
                              : "border-white/[0.08] bg-white/[0.02] text-slate-400",
                          )}
                        >
                          {channel}
                        </button>
                      );
                    })}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      ["firstSms", "First SMS"],
                      ["firstEmail", "First Email"],
                      ["voicemailScript", "Voicemail / Call Script"],
                      ["followUpEmail", "Follow-Up Email"],
                      ["finalReminder", "Final Reminder"],
                    ].map(([key, label]) => (
                      <label
                        key={key}
                        className={cn("block", key === "finalReminder" && "md:col-span-2")}
                      >
                        <span className="mb-1 block text-xs text-slate-400">{label}</span>
                        <textarea
                          value={
                            pipelineWorkflow.followUpMessages[
                              key as keyof PipelineWorkflowState["followUpMessages"]
                            ]
                          }
                          rows={key === "finalReminder" ? 3 : 2}
                          onChange={(e) =>
                            updateFollowUpMessage(
                              key as keyof PipelineWorkflowState["followUpMessages"],
                              e.target.value,
                            )
                          }
                          className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {pipelineBuilderTab === "preview" && (
                <div className="space-y-5">
                  <div className="grid gap-3 md:grid-cols-6">
                    {[
                      "Landing Page Form",
                      "New Lead",
                      "SMS Sent",
                      "AI Agent Qualifies",
                      "Appointment Booked",
                      "Pipeline Updated",
                    ].map((step, index) => (
                      <div
                        key={step}
                        className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-center"
                      >
                        <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/15 text-xs font-semibold text-violet-200">
                          {index + 1}
                        </span>
                        <p className="mt-3 text-xs font-medium text-white">{step}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
                      <p className="text-sm font-semibold text-white">Workflow summary</p>
                      <p className="mt-2 text-xs leading-5 text-slate-400">
                        {profile.businessName || "Your business"} will capture{" "}
                        {formatOptionLabel(PRIMARY_GOAL_OPTIONS, offerGoals.primaryGoal).toLowerCase()} from the{" "}
                        {selectedLandingPage.title.toLowerCase()}, then route each lead through a{" "}
                        {pipelineWorkflow.pipelineType.toLowerCase()} pipeline for {profile.mainOffer || "the main offer"}.
                      </p>
                      <div className="mt-4 grid gap-2 text-xs text-slate-400">
                        <p>
                          <span className="text-slate-300">Target customer:</span>{" "}
                          {profile.targetCustomer || "Not specified yet"}
                        </p>
                        <p>
                          <span className="text-slate-300">Owner:</span> {pipelineWorkflow.leadOwner}
                        </p>
                        <p>
                          <span className="text-slate-300">Response:</span>{" "}
                          {pipelineWorkflow.responseSpeed}
                        </p>
                        <p>
                          <span className="text-slate-300">Channels:</span>{" "}
                          {pipelineWorkflow.followUpChannels.join(", ")}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">
                      <p className="text-sm font-semibold text-violet-100">How this connects</p>
                      <ul className="mt-3 space-y-2 text-xs leading-5 text-violet-100/80">
                        <li>Step 2 defines the goal and conversion action.</li>
                        <li>Step 3 builds the landing page that captures the lead.</li>
                        <li>Step 4 defines what happens after someone converts.</li>
                        <li>Step 5 connects the tools needed to run the workflow.</li>
                        <li>Step 6 activates AI agents to qualify, follow up, and book.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStepId === "ai_agents" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-white">AI Agents</h2>
                <p className="mt-1 text-sm text-slate-400">
                  AI is configuring agents around a{" "}
                  {formatOptionLabel(OFFER_TYPE_OPTIONS, offerGoals.offerType).toLowerCase()} that
                  drives{" "}
                  {formatOptionLabel(PRIMARY_GOAL_OPTIONS, offerGoals.primaryGoal).toLowerCase()}.
                </p>
              </div>
              <OnboardingStepAiAssistant
                title="Optional: ask AI which agents you need"
                description="Describe how you handle leads and AI will recommend the agents to activate."
                placeholder='e.g. "I miss a lot of calls and never follow up with old leads."'
                suggestions={[
                  "Which AI agents do I need?",
                  "I want missed-call text-back and review requests",
                  "Help me follow up with leads automatically",
                ]}
                pending={agentsAiPending}
                error={agentsAiError}
                message={agentsAiMessage}
                onRun={runAgentsAi}
              />
              <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4 text-center">
                <Sparkles className="mx-auto h-8 w-8 text-violet-400" />
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-300">
                  Your AI agents will be activated automatically when you launch.
                </p>
              </div>
            </div>
          )}

          {currentStepId === "tracking" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Tracking</h2>
                <p className="mt-1 text-sm text-slate-400">
                  AI is configuring tracking so your dashboard can measure{" "}
                  {formatOptionLabel(PRIMARY_GOAL_OPTIONS, offerGoals.primaryGoal).toLowerCase()} via{" "}
                  {formatOptionLabel(
                    CONVERSION_ACTION_OPTIONS,
                    offerGoals.preferredConversionAction,
                  ).toLowerCase()}
                  .
                </p>
              </div>
              <OnboardingStepAiAssistant
                title="Optional: ask AI what tracking to set up"
                description="Describe your goal and AI will recommend the tracking and analytics platforms to connect."
                placeholder='e.g. "I want to know which ads bring in form submissions."'
                suggestions={[
                  "What tracking do I need for a form goal?",
                  "Track phone calls from my ads",
                  "Set up conversion tracking",
                ]}
                pending={trackingAiPending}
                error={trackingAiError}
                message={trackingAiMessage}
                onRun={runTrackingAi}
              />
              <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4 text-center">
                <Sparkles className="mx-auto h-8 w-8 text-violet-400" />
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-300">
                  Tracking is configured automatically when your tools are connected at launch.
                </p>
              </div>
            </div>
          )}

          {currentStepId === "connect_accounts" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Connect Accounts</h2>
              <p className="text-sm text-slate-400">
                Link your marketing, CRM, and payment tools. Zernio is optional but unlocks ads at
                launch.
              </p>
              <OnboardingStepAiAssistant
                title="Optional: let AI recommend what to connect"
                description="Tell AI how you market and it will highlight the accounts worth connecting for your goal."
                placeholder='e.g. "I run Google and Facebook ads and take payments through Stripe."'
                suggestions={[
                  "Which accounts should I connect for lead gen?",
                  "I run Google and Facebook ads",
                  "I take bookings and payments online",
                ]}
                pending={connectAiPending}
                error={connectAiError}
                message={connectAiMessage}
                onRun={runConnectAi}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <OnboardingZernioConnectCard
                  apiKey={zernioApiKey}
                  onApiKeyChange={(key) => {
                    setZernioApiKey(key);
                    if (key.trim()) {
                      setIntegrations((prev) =>
                        prev.map((item) =>
                          item.id === "zernio" ? { ...item, connected: true } : item,
                        ),
                      );
                    }
                  }}
                  verified={Boolean(zernioApiKey.trim())}
                />
                {integrations
                  .filter((item) => item.id !== "zernio")
                  .map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-white">{item.name}</p>
                        {item.description ? (
                          <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleIntegration(item.id)}
                        className={cn(
                          "shrink-0 rounded-lg px-3 py-1 text-xs font-medium",
                          item.connected
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-violet-600/20 text-violet-200",
                        )}
                      >
                        {item.connected ? "Connected" : "Connect"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStepId === "ads_agent" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Ads Agent</h2>
              <p className="text-sm text-slate-400">
                Generate campaigns using your business profile, landing page, keywords, niche,
                location, offer, budget, and target customer.
              </p>
              <OnboardingStepAiAssistant
                title="Optional: let AI draft a starter ad plan"
                description="Describe your budget or goal and AI will suggest channels, budget split, and an ad angle."
                placeholder='e.g. "Draft a starter ad plan for $1,000/month focused on booked appointments."'
                suggestions={[
                  "Draft a starter ad plan for $1,000/month",
                  "Best channel for booked appointments?",
                  "What ad angle should I use?",
                ]}
                pending={adsAiPending}
                error={adsAiError}
                message={adsAiMessage}
                onRun={runAdsAi}
              />
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  ["Niche", profile.industry],
                  ["Location", "Austin, TX"],
                  ["Offer", profile.mainOffer],
                  ["Offer Type", formatOptionLabel(OFFER_TYPE_OPTIONS, offerGoals.offerType)],
                  ["Primary Goal", formatOptionLabel(PRIMARY_GOAL_OPTIONS, offerGoals.primaryGoal)],
                  [
                    "Conversion",
                    formatOptionLabel(
                      CONVERSION_ACTION_OPTIONS,
                      offerGoals.preferredConversionAction,
                    ),
                  ],
                  ["Monthly Target", offerGoals.monthlyTarget],
                  ["Average Deal Value", offerGoals.averageDealValue],
                  ["Budget", "$70/day"],
                  ["Target Customer", profile.targetCustomer],
                  ["Keywords", profile.keywords],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                  >
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="mt-1 text-sm text-white">{value}</p>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white"
              >
                <Sparkles className="h-4 w-4" />
                Generate Campaigns
              </button>
            </div>
          )}

          {currentStepId === "pipeline_test" && (
            <OnboardingPipelineTestPanel
              businessName={profile.businessName}
              landingTitle={selectedLandingPage.title}
              primaryGoal={formatOptionLabel(PRIMARY_GOAL_OPTIONS, offerGoals.primaryGoal)}
              pipelineWorkflow={pipelineWorkflow}
              logoUrl={logoUrl}
              zernioConfigured={Boolean(zernioApiKey.trim())}
              testPassed={pipelineTestPassed}
              onTestComplete={() => setPipelineTestPassed(true)}
            />
          )}

          {currentStepId === "launch" && (
            <div className="space-y-6 py-8 text-center">
              <Rocket className="mx-auto h-12 w-12 text-violet-400" />
              <h2 className="text-2xl font-semibold text-white">Ready to Launch</h2>
              <p className="mx-auto max-w-md text-sm text-slate-400">
                Your pipeline test passed. Launch to create your landing page, CRM pipeline,
                automations{zernioApiKey.trim() ? ", and connect Zernio for ads" : ""}.
              </p>
              {!pipelineTestPassed ? (
                <p className="text-sm text-amber-300">
                  Go back to <strong>Test Pipeline</strong> and run the simulation first.
                </p>
              ) : null}
              <button
                type="button"
                onClick={handleLaunch}
                disabled={isLaunching || !pipelineTestPassed}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-violet-900/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLaunching ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Rocket className="h-5 w-5" />
                )}
                {isLaunching ? "Launching..." : "Launch My System"}
              </button>
              {launchError ? (
                <p role="alert" className="mx-auto max-w-md text-sm text-rose-300">
                  {launchError}
                </p>
              ) : null}
              <p className="text-xs text-slate-500">
                After launch you&apos;ll be taken to{" "}
                <ExternalLink className="inline h-3 w-3" /> /dashboard
              </p>
            </div>
          )}

          {currentStepId !== "launch" && (
            <div className="mt-8 flex items-center justify-between border-t border-white/[0.06] pt-6">
              <button
                type="button"
                onClick={goPrev}
                disabled={currentIndex === 0}
                className="inline-flex items-center gap-1 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center gap-1 rounded-xl bg-violet-600/30 px-4 py-2 text-sm font-medium text-violet-100"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
