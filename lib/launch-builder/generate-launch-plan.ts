import { detectNiche } from "@/lib/niche/detect-niche";
import { getNicheBlueprint } from "@/lib/niche/blueprints";
import type { OnboardingDraft } from "@/lib/onboarding/draft";
import type {
  LaunchPlan,
  LaunchReadiness,
  LaunchStep,
  LaunchStepKind,
} from "@/lib/launch-builder/types";
import { LAUNCH_STEP_ORDER } from "@/lib/launch-builder/types";
import type { CampaignGoalId } from "@/types/platform-growth";

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function inferPlatforms(draft: OnboardingDraft): string[] {
  const out: string[] = [];
  if (!draft.skippedConnections.includes("google")) out.push("Google Ads");
  if (!draft.skippedConnections.includes("meta")) out.push("Meta Ads");
  if (out.length === 0) out.push("Google Ads", "Meta Ads");
  return out;
}

function goalLabel(goal: CampaignGoalId): string {
  const map: Record<CampaignGoalId, string> = {
    generate_leads: "Lead generation",
    book_appointments: "Appointment bookings",
    sell_products: "Product sales",
    promote_services: "Service promotion",
    website_traffic: "Website traffic",
    form_submissions: "Form submissions",
    grow_email_list: "Email list growth",
    retarget_visitors: "Retargeting",
    local_ads: "Local awareness",
    scale_campaigns: "Scale conversions",
  };
  return map[goal] ?? "Lead generation";
}

function brandVoice(draft: OnboardingDraft): string {
  if (draft.brandTone.trim()) return draft.brandTone.trim();
  return "Professional, clear, and trustworthy";
}

function businessDescription(draft: OnboardingDraft): string {
  const parts = [
    draft.services.trim(),
    draft.targetAudience.trim() && `We serve ${draft.targetAudience.trim()}.`,
    draft.idealCustomer.trim() && `Ideal customer: ${draft.idealCustomer.trim()}.`,
  ].filter(Boolean);
  return parts.join(" ") || `${draft.businessName} provides quality services in ${draft.industry || "your market"}.`;
}

function dailyBudget(monthly: number): number {
  if (monthly <= 0) return 25;
  return Math.max(15, Math.round(monthly / 30));
}

function buildLandingStep(draft: OnboardingDraft, nicheName: string): LaunchStep {
  const offer = draft.offerPromotion.trim() || `Get started with ${draft.businessName} today`;
  const location = [draft.cityState, draft.serviceArea].filter(Boolean).join(" · ") || "Your area";
  const headline =
    nicheName === "Real Estate"
      ? `Find Your Next Home With ${draft.businessName}`
      : nicheName === "Restaurant"
        ? `${draft.businessName} — Reserve Your Table or Catering Quote`
        : `${draft.businessName} — ${offer}`;

  return {
    id: uid("lp"),
    kind: "landing_page",
    title: "STEP 1 — Landing Page",
    status: "draft_generated",
    order: 0,
    data: {
      headline,
      subheadline: businessDescription(draft).slice(0, 160),
      cta: draft.campaignGoal === "book_appointments" ? "Book a Free Consultation" : "Get My Free Quote",
      bodyCopy: `${businessDescription(draft)}\n\n${offer}\n\nServing ${location}. ${brandVoice(draft)} tone throughout.`,
      creativeDirection: `Hero imagery: ${nicheName} customers in ${location}. Brand colors: ${draft.brandColors || "violet/indigo gradient on dark UI"}.`,
      formFields: ["Full Name", "Email", "Phone", draft.services ? "Service Interest" : "Message"],
      seoTitle: `${draft.businessName} | ${draft.industry || nicheName} in ${draft.cityState || location}`,
      seoDescription: `${offer} — ${draft.businessName}. ${draft.targetAudience || "Local customers"} welcome.`,
      offer,
      location,
    },
  };
}

function buildAdCampaignStep(draft: OnboardingDraft, nicheName: string, platforms: string[]): LaunchStep {
  const monthly = Number(draft.monthlyBudget) || 1500;
  const daily = dailyBudget(monthly);
  const geo = [draft.cityState, draft.serviceArea].filter(Boolean).join(", ") || "Primary service area";

  return {
    id: uid("ads"),
    kind: "ad_campaign",
    title: "STEP 2 — Ad Campaign",
    status: "draft_generated",
    order: 1,
    data: {
      campaignName: `${draft.businessName} — ${nicheName} ${goalLabel(draft.campaignGoal)}`,
      platformRecommendation: platforms.join(" + "),
      dailyBudgetRecommendation: daily,
      monthlyBudget: monthly,
      audienceTargeting: draft.targetAudience || `Adults interested in ${draft.industry || nicheName} near ${geo}`,
      interests: [
        draft.industry || nicheName,
        ...(draft.services ? draft.services.split(",").map((s) => s.trim()).slice(0, 3) : []),
        goalLabel(draft.campaignGoal),
      ].filter(Boolean),
      geographicSettings: `Radius targeting around ${geo}; exclude areas outside ${draft.serviceArea || "service zone"}`,
      objective: goalLabel(draft.campaignGoal),
      placements: platforms.includes("Meta Ads")
        ? ["Facebook Feed", "Instagram Feed", "Stories", "Reels"]
        : ["Search", "Display", "Performance Max"],
      conversionEvent:
        draft.campaignGoal === "book_appointments" ? "Schedule" : "Lead / Form Submit",
    },
  };
}

function buildCreativesStep(draft: OnboardingDraft, nicheName: string): LaunchStep {
  const offer = draft.offerPromotion.trim() || "Limited-time offer for new customers";
  const voice = brandVoice(draft);

  return {
    id: uid("cr"),
    kind: "ad_creatives",
    title: "STEP 3 — AI Ad Creatives",
    status: "draft_generated",
    order: 2,
    data: {
      headlines: [
        `${draft.businessName} — ${offer}`,
        `${nicheName} experts in ${draft.cityState || "your city"}`,
        `Trusted ${draft.industry || nicheName} — book today`,
      ],
      primaryTexts: [
        `${businessDescription(draft)} ${offer}. ${voice}.`,
        `Serving ${draft.serviceArea || draft.cityState || "your area"}. Tap to ${draft.campaignGoal === "book_appointments" ? "schedule" : "get started"}.`,
      ],
      hooks: [
        `Still searching for the right ${draft.industry || "provider"}?`,
        `What if ${draft.idealCustomer || "your ideal customer"} found you first?`,
        `${offer} — spots filling up.`,
      ],
      offers: [offer, "Free consultation", "New customer special"],
      ctaVariations: ["Book Now", "Get Quote", "Learn More", "Start Today"],
      creativeConcepts: [
        `Before/after or outcome-focused ${nicheName} creative`,
        `Local trust badges + ${draft.businessName} team`,
        `Mobile-first vertical video hook (3s problem → 5s solution)`,
      ],
    },
  };
}

function buildFollowUpStep(nicheName: string): LaunchStep {
  return {
    id: uid("fu"),
    kind: "follow_up_automation",
    title: "STEP 4 — Follow-Up Automation",
    status: "draft_generated",
    order: 3,
    data: {
      triggers: [
        { id: "t1", label: "New Lead", enabled: true },
        { id: "t2", label: "Missed Call", enabled: true },
        { id: "t3", label: "Form Submission", enabled: true },
        { id: "t4", label: "Appointment Booked", enabled: true },
        { id: "t5", label: "No Response (48h)", enabled: true },
        { id: "t6", label: "Won Opportunity", enabled: true },
      ],
      actions: [
        { id: "a1", type: "email", label: "Instant welcome email" },
        { id: "a2", type: "task", label: "Assign follow-up task to owner" },
        { id: "a3", type: "notification", label: "Notify assigned team member" },
        { id: "a4", type: "ai_agent", label: "AI agent qualification response" },
        { id: "a5", type: "wait", label: "Wait 24h", config: { hours: 24 } },
        { id: "a6", type: "email", label: "Reminder email" },
        { id: "a7", type: "task", label: "Create call task (Day 5)" },
      ],
    },
  };
}

function buildWorkflowStep(blueprint: ReturnType<typeof getNicheBlueprint>): LaunchStep {
  const nodes = blueprint.workflows.slice(0, 6).flatMap((wf, i) =>
    wf.definition.nodes.slice(0, 2).map((n, j) => ({
      id: `${wf.slug}-${i}-${j}`,
      label: n.label,
      type: n.type,
    })),
  );

  return {
    id: uid("wf"),
    kind: "workflow_automation",
    title: "STEP 5 — Workflow Automation",
    status: "draft_generated",
    order: 4,
    data: {
      workflowName: `${blueprint.displayName} Automated Growth Workflow`,
      description: `Pre-built ${blueprint.displayName.toLowerCase()} workflows for lead capture, nurture, and conversion.`,
      nodes: nodes.length > 0 ? nodes : [{ id: "n1", label: "New lead trigger", type: "trigger" }],
      nicheExamples: blueprint.workflows.map((w) => w.name),
    },
  };
}

function buildPipelineStep(blueprint: ReturnType<typeof getNicheBlueprint>): LaunchStep {
  const primary = blueprint.pipelines.find((p) => p.isDefault) ?? blueprint.pipelines[0]!;
  const secondary = blueprint.pipelines.filter((p) => !p.isDefault);

  return {
    id: uid("pipe"),
    kind: "pipeline_crm",
    title: "STEP 6 — Pipeline / CRM",
    status: "draft_generated",
    order: 5,
    data: {
      pipelineName: primary.name,
      stages: primary.stages.map((s) => ({
        name: s.name,
        stageType: s.stageType,
      })),
      secondaryPipelines: secondary.map((p) => ({
        name: p.name,
        stages: p.stages.map((s) => s.name),
      })),
    },
  };
}

function buildAppointmentStep(draft: OnboardingDraft, nicheName: string): LaunchStep {
  return {
    id: uid("appt"),
    kind: "appointment_logic",
    title: "STEP 7 — Appointment & Lead Handling",
    status: "draft_generated",
    order: 6,
    data: {
      bookingObjective:
        draft.campaignGoal === "book_appointments"
          ? "Book qualified consultations directly from ads and landing page"
          : "Qualify leads then offer appointment slots",
      qualificationRules: [
        `Confirm service fit: ${draft.services || draft.industry || nicheName}`,
        `Capture budget/timeline when relevant`,
        `Route hot leads to ${draft.leadNotifyEmail || draft.email || "owner inbox"}`,
      ],
      routingRules: [
        "New lead → default pipeline stage",
        "Qualified → appointment scheduling",
        "No-show → re-engagement workflow",
      ],
      reminderSchedule: ["24h before appointment email", "2h before appointment email"],
      noShowHandling: "Move to nurture sequence + create callback task within 2 hours",
    },
  };
}

function buildNurtureStep(nicheName: string): LaunchStep {
  return {
    id: uid("nur"),
    kind: "nurture_sequence",
    title: "STEP 8 — Email Nurture Sequence",
    status: "draft_generated",
    order: 7,
    data: {
      sequenceName: `${nicheName} Growth Nurture`,
      notes:
        "Email + task sequence (editable). SMS can be added later via webhook automations if enabled on your plan.",
      touches: [
        { day: 0, channel: "email", label: "Instant welcome email", templateKey: "welcome" },
        { day: 1, channel: "email", label: "Follow-up email", templateKey: "follow_up_day_1" },
        { day: 3, channel: "email", label: "Reminder email", templateKey: "follow_up_day_3" },
        { day: 5, channel: "task", label: "Call task — personal outreach" },
        { day: 7, channel: "email", label: "Final follow-up email", templateKey: "follow_up_day_7" },
      ],
    },
  };
}

function computeReadiness(steps: LaunchStep[]): LaunchReadiness {
  const readiness = {} as LaunchReadiness;
  for (const kind of LAUNCH_STEP_ORDER) {
    readiness[kind] = steps.some((s) => s.kind === kind && s.status !== "draft_generated");
  }
  for (const kind of LAUNCH_STEP_ORDER) {
    if (!readiness[kind]) {
      readiness[kind] = steps.some((s) => s.kind === kind);
    }
  }
  return readiness;
}

/** Build a complete editable launch plan from onboarding form data. */
export function generateLaunchPlanFromDraft(draft: OnboardingDraft): LaunchPlan {
  const { nicheId, displayName } = detectNiche({
    industry: draft.industry,
    businessType: draft.businessType,
    services: draft.services,
    businessName: draft.businessName,
  });
  const blueprint = getNicheBlueprint(nicheId);
  const platforms = inferPlatforms(draft);

  const steps: LaunchStep[] = [
    buildLandingStep(draft, displayName),
    buildAdCampaignStep(draft, displayName, platforms),
    buildCreativesStep(draft, displayName),
    buildFollowUpStep(displayName),
    buildWorkflowStep(blueprint),
    buildPipelineStep(blueprint),
    buildAppointmentStep(draft, displayName),
    buildNurtureStep(displayName),
  ].map((s, i) => ({ ...s, order: i }));

  const sourceSummary = [
    draft.businessName,
    draft.industry,
    draft.businessType,
    draft.services,
    draft.targetAudience,
    draft.cityState || draft.serviceArea,
    goalLabel(draft.campaignGoal),
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    version: 1,
    nicheId,
    nicheDisplayName: displayName,
    businessName: draft.businessName,
    generatedAt: new Date().toISOString(),
    sourceSummary,
    steps,
    readiness: computeReadiness(steps),
  };
}

export function regenerateLaunchStep(
  draft: OnboardingDraft,
  kind: LaunchStepKind,
  existingPlan: LaunchPlan,
): LaunchPlan {
  const full = generateLaunchPlanFromDraft(draft);
  const replacement = full.steps.find((s) => s.kind === kind);
  if (!replacement) return existingPlan;

  const steps = existingPlan.steps.map((s) =>
    s.kind === kind ? { ...replacement, id: s.id, status: "draft_generated" as const } : s,
  );
  return { ...existingPlan, steps, generatedAt: new Date().toISOString() };
}

export function duplicateLaunchStep(plan: LaunchPlan, stepId: string): LaunchPlan {
  const source = plan.steps.find((s) => s.id === stepId);
  if (!source) return plan;
  const copy = {
    ...structuredClone(source),
    id: uid("dup"),
    title: `${source.title} (Copy)`,
    order: plan.steps.length,
  };
  return { ...plan, steps: [...plan.steps, copy] };
}

export function deleteLaunchStep(plan: LaunchPlan, stepId: string): LaunchPlan {
  return { ...plan, steps: plan.steps.filter((s) => s.id !== stepId) };
}

export function reorderLaunchSteps(plan: LaunchPlan, stepIds: string[]): LaunchPlan {
  const byId = new Map(plan.steps.map((s) => [s.id, s]));
  const steps = stepIds
    .map((id, order) => {
      const step = byId.get(id);
      return step ? { ...step, order } : null;
    })
    .filter((s): s is LaunchStep => s != null);
  return { ...plan, steps };
}

export function updateLaunchStepData(
  plan: LaunchPlan,
  stepId: string,
  data: Record<string, unknown>,
): LaunchPlan {
  const steps = plan.steps.map((s) => {
    if (s.id !== stepId) return s;
    return { ...s, data, status: "edited" as const } as LaunchStep;
  });
  return { ...plan, steps };
}

export function allLaunchSystemsReady(plan: LaunchPlan): boolean {
  return LAUNCH_STEP_ORDER.every((kind) => plan.steps.some((s) => s.kind === kind));
}
