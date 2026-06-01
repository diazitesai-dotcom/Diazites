"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/auth/session";
import { isAdAccountRowConnected } from "@/lib/integrations/ad-account-connection";
import { listBusinessAdConnections } from "@/lib/integrations/business-ad-connections";
import type { OnboardingChecklistKey } from "@/lib/onboarding/draft";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";
import { activateAgent } from "@/services/agents/agent.service";
import { createCampaign } from "@/services/campaigns/campaign.service";
import {
  generateLandingPage,
  updateLandingPage,
} from "@/services/landing/landing-page.service";
import type { AgentType } from "@/types/domain";

type SupabaseClientType = Awaited<ReturnType<typeof createServerSupabaseClient>>;

type LandingArtifact = {
  type: "landing_page";
  slug: string;
  url: string;
  headline: string;
  theme: string;
  design: string;
};

type CampaignArtifact = {
  type: "campaign";
  platform: string;
  budget: number;
  goal: string;
  location: string;
};

type AgentsArtifact = { type: "agents"; agents: string[] };

type FunnelArtifact = {
  type: "funnel";
  landingPage: Omit<LandingArtifact, "type"> | null;
  agents: string[];
  campaign: Omit<CampaignArtifact, "type"> | null;
};

/** Structured description of what the assistant just built — rendered as a card. */
export type SetupArtifact =
  | LandingArtifact
  | CampaignArtifact
  | AgentsArtifact
  | FunnelArtifact;

/** A single node in an auto-generated funnel plan. */
export type FunnelStepKind =
  | "landing_page"
  | "campaign"
  | "ad_setup"
  | "follow_up"
  | "qualification";

export type FunnelStepPlan = {
  id: string;
  kind: FunnelStepKind;
  title: string;
  summary: string;
  /** Editable hints surfaced inline in the preview. */
  headline?: string;
  platform?: string;
  budget?: number;
};

export type FunnelPlanResult =
  | { ok: true; businessName: string; steps: FunnelStepPlan[] }
  | { ok: false; error: string };

/**
 * Result of running a setup step from the Mission Control assistant.
 * - `done`   → completed inline, no navigation needed (may include an artifact).
 * - `error`  → something failed; show the message.
 * - `manual` → can't be automated; the assistant should route the user (carrying `href`).
 */
export type SetupStepResult =
  | { status: "done"; title: string; detail: string; artifact?: SetupArtifact }
  | { status: "error"; title: string; detail: string }
  | { status: "manual"; title: string; detail: string; href: string };

const MANUAL_STEP_HREFS: Partial<Record<OnboardingChecklistKey, { href: string; detail: string }>> = {
  profile_complete: {
    href: "/dashboard/settings",
    detail: "Finish your business profile so I can tailor everything to you.",
  },
  integrations_connected: {
    href: "/dashboard/integrations",
    detail:
      "Connecting an ad or CRM platform (like Zernio) needs your login, so I'll open the Integrations page for you. Come back here when you're done.",
  },
  team_invited: {
    href: "/dashboard/organization",
    detail: "Invite teammates and assign seats from your Organization page.",
  },
};

type BusinessCtx = {
  userId: string;
  supabase: SupabaseClientType;
  businessId: string;
  businessName: string;
  location: string;
  offer: string;
  monthlyBudget: number;
};

async function resolveBusinessCtx(): Promise<BusinessCtx | { error: SetupStepResult }> {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business?.id) {
    return {
      error: {
        status: "manual",
        title: "Finish onboarding first",
        detail: "I couldn't find your business profile yet.",
        href: "/onboarding",
      },
    };
  }

  return {
    userId: user.id,
    supabase,
    businessId: business.id,
    businessName: (business.name as string) ?? "your business",
    location:
      (business.city_state as string | null) ?? (business.service_area as string | null) ?? "",
    offer: (business.services as string | null) ?? "Free consultation",
    monthlyBudget: Number(business.monthly_budget) || 0,
  };
}

async function buildLandingPage(
  ctx: BusinessCtx,
): Promise<{ ok: true; artifact: LandingArtifact } | { ok: false; error: string }> {
  const generated = await generateLandingPage(ctx.supabase, ctx.userId, ctx.businessId, {
    headline: `${ctx.businessName} — Get Started Today`,
    offer: ctx.offer,
    location: ctx.location,
  });
  if (!generated.success) return { ok: false, error: generated.error };

  const published = await updateLandingPage(
    ctx.supabase,
    ctx.userId,
    ctx.businessId,
    generated.data.slug,
    { published: true },
  );
  if (!published.success) return { ok: false, error: published.error };

  return {
    ok: true,
    artifact: {
      type: "landing_page",
      slug: generated.data.slug,
      url: `/p/${generated.data.slug}`,
      headline: `${ctx.businessName} — Get Started Today`,
      theme: generated.data.theme,
      design: generated.data.design,
    },
  };
}

async function buildCampaign(
  ctx: BusinessCtx,
  overrides?: { budget?: number; platform?: string },
): Promise<{ ok: true; artifact: CampaignArtifact } | { ok: false; error: string }> {
  const platform = overrides?.platform ?? (await pickCampaignPlatform(ctx.supabase, ctx.businessId));
  const budget =
    overrides?.budget && overrides.budget > 0
      ? Math.round(overrides.budget)
      : ctx.monthlyBudget > 0
        ? Math.round(ctx.monthlyBudget / 30)
        : 20;
  const created = await createCampaign(ctx.supabase, ctx.userId, {
    businessId: ctx.businessId,
    platform,
    budget,
    goal: "lead_generation",
    location: ctx.location || null,
    status: "draft",
  });
  if (!created.success) return { ok: false, error: created.error };

  return {
    ok: true,
    artifact: {
      type: "campaign",
      platform,
      budget,
      goal: "lead_generation",
      location: ctx.location || "your area",
    },
  };
}

async function buildAgents(
  ctx: BusinessCtx,
  agentTypes: AgentType[],
): Promise<{ ok: true; agents: string[] } | { ok: false; error: string }> {
  const activated: AgentType[] = [];
  for (const agentType of agentTypes) {
    const result = await activateAgent(ctx.supabase, ctx.userId, agentType);
    if (result.success) activated.push(agentType);
  }
  if (activated.length === 0) {
    return { ok: false, error: "None of the recommended agents could be turned on." };
  }
  return { ok: true, agents: activated.map(agentLabel) };
}

export async function runSetupStepAction(
  stepKey: OnboardingChecklistKey,
): Promise<SetupStepResult> {
  const manual = MANUAL_STEP_HREFS[stepKey];
  if (manual) {
    return { status: "manual", title: "Needs a quick action from you", detail: manual.detail, href: manual.href };
  }

  const resolved = await resolveBusinessCtx();
  if ("error" in resolved) return resolved.error;
  const ctx = resolved;

  try {
    switch (stepKey) {
      case "agents_assigned": {
        const res = await buildAgents(ctx, ["lead_qualification", "ai_follow_up", "social_ads"]);
        if (!res.ok) return { status: "error", title: "Couldn't activate agents", detail: res.error };
        revalidateSetup();
        return {
          status: "done",
          title: `${res.agents.length} agent${res.agents.length > 1 ? "s" : ""} activated`,
          detail: `${res.agents.join(", ")} ${res.agents.length > 1 ? "are" : "is"} now live and working in the background.`,
          artifact: { type: "agents", agents: res.agents },
        };
      }

      case "ai_active": {
        const res = await buildAgents(ctx, ["ai_follow_up"]);
        if (!res.ok) return { status: "error", title: "Couldn't enable follow-up", detail: res.error };
        revalidateSetup();
        return {
          status: "done",
          title: "AI follow-up is live",
          detail:
            "New leads will now be contacted instantly and nurtured automatically until they're ready to talk.",
          artifact: { type: "agents", agents: res.agents },
        };
      }

      case "landing_page_ready": {
        const res = await buildLandingPage(ctx);
        if (!res.ok) return { status: "error", title: "Couldn't build the landing page", detail: res.error };
        revalidateSetup();
        return {
          status: "done",
          title: "Landing page published",
          detail: `Your AI-designed lead-capture page is live and ready for traffic. Every page gets a unique design.`,
          artifact: res.artifact,
        };
      }

      case "campaign_built": {
        const res = await buildCampaign(ctx);
        if (!res.ok) return { status: "error", title: "Couldn't draft the campaign", detail: res.error };
        revalidateSetup();
        return {
          status: "done",
          title: "Lead-gen campaign drafted",
          detail: `A ${res.artifact.platform} campaign is drafted at ~$${res.artifact.budget}/day. Review and launch it whenever you're ready.`,
          artifact: res.artifact,
        };
      }

      default:
        return {
          status: "manual",
          title: "Open this step",
          detail: "Let's set this up together.",
          href: "/dashboard",
        };
    }
  } catch (err) {
    return {
      status: "error",
      title: "Setup hit a snag",
      detail: err instanceof Error ? err.message : "Unexpected error — please try again.",
    };
  }
}

/**
 * Builds an entire funnel in one shot — landing page + agent stack + campaign —
 * and returns a single funnel artifact for the assistant to render.
 */
export async function runCompleteFunnelAction(): Promise<SetupStepResult> {
  const resolved = await resolveBusinessCtx();
  if ("error" in resolved) return resolved.error;
  const ctx = resolved;

  try {
    const landing = await buildLandingPage(ctx);
    const agents = await buildAgents(ctx, [
      "landing_page",
      "lead_qualification",
      "ai_follow_up",
      "social_ads",
    ]);
    const campaign = await buildCampaign(ctx);

    const landingPage = landing.ok ? { ...landing.artifact } : null;
    const agentNames = agents.ok ? agents.agents : [];
    const campaignData = campaign.ok ? { ...campaign.artifact } : null;

    if (!landingPage && agentNames.length === 0 && !campaignData) {
      return {
        status: "error",
        title: "Funnel build failed",
        detail: "I couldn't create the funnel pieces. Please try again in a moment.",
      };
    }

    revalidateSetup();

    const pieces = [
      landingPage ? "a uniquely designed landing page" : null,
      agentNames.length ? `${agentNames.length} AI agents` : null,
      campaignData ? `a ${campaignData.platform} campaign` : null,
    ].filter(Boolean);

    const landingForFunnel: Omit<LandingArtifact, "type"> | null = landingPage
      ? {
          slug: landingPage.slug,
          url: landingPage.url,
          headline: landingPage.headline,
          theme: landingPage.theme,
          design: landingPage.design,
        }
      : null;

    return {
      status: "done",
      title: "Complete funnel launched",
      detail: `Built ${pieces.join(", ")} — all wired together and ready to capture and convert leads.`,
      artifact: {
        type: "funnel",
        landingPage: landingForFunnel,
        agents: agentNames,
        campaign: campaignData,
      },
    };
  } catch (err) {
    return {
      status: "error",
      title: "Funnel build hit a snag",
      detail: err instanceof Error ? err.message : "Unexpected error — please try again.",
    };
  }
}

/**
 * Auto-generates a complete funnel plan around whatever the user is creating.
 * Returns suggested (not yet built) steps so the copilot can render an editable,
 * interactive preview. If a seed asset is given, it's surfaced first.
 */
export async function generateFunnelPlanAction(
  seedKind?: FunnelStepKind,
): Promise<FunnelPlanResult> {
  const resolved = await resolveBusinessCtx();
  if ("error" in resolved) return { ok: false, error: resolved.error.detail };
  const ctx = resolved;

  const platform = await pickCampaignPlatform(ctx.supabase, ctx.businessId);
  const budget = ctx.monthlyBudget > 0 ? Math.round(ctx.monthlyBudget / 30) : 20;

  const steps: FunnelStepPlan[] = [
    {
      id: "step-landing",
      kind: "landing_page",
      title: "Landing page",
      summary: `A unique, AI-designed capture page for ${ctx.businessName}.`,
      headline: `${ctx.businessName} — Get Started Today`,
    },
    {
      id: "step-campaign",
      kind: "campaign",
      title: "Ad campaign",
      summary: `Lead-gen campaign on ${platform} driving traffic to your page.`,
      platform,
      budget,
    },
    {
      id: "step-ads",
      kind: "ad_setup",
      title: "Ad creative & targeting",
      summary: "AI ad agents generate creatives and dial in audience targeting.",
    },
    {
      id: "step-followup",
      kind: "follow_up",
      title: "Follow-up automation",
      summary: "Every new lead is contacted instantly and nurtured automatically.",
    },
  ];

  if (seedKind) {
    steps.sort((a, b) => Number(b.kind === seedKind) - Number(a.kind === seedKind));
  }

  return { ok: true, businessName: ctx.businessName, steps };
}

/** Builds a single funnel step inline and returns its artifact. */
export async function launchFunnelStepAction(
  kind: FunnelStepKind,
  overrides?: { budget?: number; platform?: string },
): Promise<SetupStepResult> {
  const resolved = await resolveBusinessCtx();
  if ("error" in resolved) return resolved.error;
  const ctx = resolved;

  try {
    switch (kind) {
      case "landing_page": {
        const res = await buildLandingPage(ctx);
        if (!res.ok) return { status: "error", title: "Landing page failed", detail: res.error };
        revalidateSetup();
        return {
          status: "done",
          title: "Landing page published",
          detail: "Your AI-designed capture page is live.",
          artifact: res.artifact,
        };
      }
      case "campaign": {
        const res = await buildCampaign(ctx, overrides);
        if (!res.ok) return { status: "error", title: "Campaign failed", detail: res.error };
        revalidateSetup();
        return {
          status: "done",
          title: "Campaign drafted",
          detail: `A ${res.artifact.platform} campaign is drafted at ~$${res.artifact.budget}/day.`,
          artifact: res.artifact,
        };
      }
      case "ad_setup": {
        const res = await buildAgents(ctx, ["social_ads", "search_ads"]);
        if (!res.ok) return { status: "error", title: "Ad setup failed", detail: res.error };
        revalidateSetup();
        return {
          status: "done",
          title: "Ad creative & targeting ready",
          detail: "Your ad agents are generating creatives and targeting.",
          artifact: { type: "agents", agents: res.agents },
        };
      }
      case "qualification": {
        const res = await buildAgents(ctx, ["lead_qualification"]);
        if (!res.ok) return { status: "error", title: "Qualification failed", detail: res.error };
        revalidateSetup();
        return {
          status: "done",
          title: "Lead qualification live",
          detail: "Incoming leads are scored and prioritized automatically.",
          artifact: { type: "agents", agents: res.agents },
        };
      }
      case "follow_up":
      default: {
        const res = await buildAgents(ctx, ["ai_follow_up"]);
        if (!res.ok) return { status: "error", title: "Follow-up failed", detail: res.error };
        revalidateSetup();
        return {
          status: "done",
          title: "Follow-up automation live",
          detail: "New leads are contacted instantly and nurtured automatically.",
          artifact: { type: "agents", agents: res.agents },
        };
      }
    }
  } catch (err) {
    return {
      status: "error",
      title: "Step hit a snag",
      detail: err instanceof Error ? err.message : "Unexpected error — please try again.",
    };
  }
}

function revalidateSetup() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/agents");
  revalidatePath("/dashboard/automations");
  revalidatePath("/dashboard/funnel");
}

function agentLabel(type: AgentType): string {
  const labels: Record<AgentType, string> = {
    social_ads: "Social Ads Agent",
    search_ads: "Search Ads Agent",
    landing_page: "Landing Page Agent",
    ai_follow_up: "AI Follow-Up Agent",
    retargeting: "Retargeting Agent",
    lead_qualification: "Lead Qualification Agent",
  };
  return labels[type] ?? type;
}

async function pickCampaignPlatform(
  supabase: SupabaseClientType,
  businessId: string,
): Promise<string> {
  try {
    const connections = await listBusinessAdConnections(supabase, businessId);
    const connected = connections.filter((c) => isAdAccountRowConnected(c));
    const platforms = connected.map((c) => String(c.platform).toLowerCase());
    if (platforms.includes("meta")) return "meta";
    if (platforms.includes("google")) return "google";
    const first = platforms.find((p) => p && p !== "zernio");
    if (first) return first;
    if (platforms.includes("zernio")) return "zernio";
  } catch {
    // fall through to default
  }
  return "meta";
}
