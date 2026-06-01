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

/**
 * Result of running a setup step from the Mission Control assistant.
 * - `done`   → completed inline, no navigation needed.
 * - `error`  → something failed; show the message.
 * - `manual` → can't be automated; the assistant should route the user (carrying `href`).
 */
export type SetupStepResult =
  | { status: "done"; title: string; detail: string }
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

export async function runSetupStepAction(
  stepKey: OnboardingChecklistKey,
): Promise<SetupStepResult> {
  const manual = MANUAL_STEP_HREFS[stepKey];
  if (manual) {
    return { status: "manual", title: "Needs a quick action from you", detail: manual.detail, href: manual.href };
  }

  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business?.id) {
    return {
      status: "manual",
      title: "Finish onboarding first",
      detail: "I couldn't find your business profile yet.",
      href: "/onboarding",
    };
  }

  const businessName = (business.name as string) ?? "your business";
  const location =
    (business.city_state as string | null) ?? (business.service_area as string | null) ?? "";
  const offer = (business.services as string | null) ?? "Free consultation";
  const monthlyBudget = Number(business.monthly_budget) || 0;

  try {
    switch (stepKey) {
      case "agents_assigned":
        return await activateAgentStack(supabase, user.id, [
          "lead_qualification",
          "ai_follow_up",
          "social_ads",
        ]);

      case "ai_active":
        return await activateAgentStack(supabase, user.id, ["ai_follow_up"], {
          title: "AI follow-up is live",
          detail:
            "New leads will now be contacted instantly and nurtured automatically until they're ready to talk.",
        });

      case "landing_page_ready": {
        const generated = await generateLandingPage(supabase, user.id, business.id, {
          headline: `${businessName} — Get Started Today`,
          offer,
          location,
        });
        if (!generated.success) {
          return { status: "error", title: "Couldn't build the landing page", detail: generated.error };
        }
        const published = await updateLandingPage(
          supabase,
          user.id,
          business.id,
          generated.data.slug,
          { published: true },
        );
        if (!published.success) {
          return {
            status: "error",
            title: "Landing page saved but not published",
            detail: published.error,
          };
        }
        revalidatePath("/dashboard");
        return {
          status: "done",
          title: "Landing page published",
          detail: `Your lead-capture page is live at /${generated.data.slug} and ready to receive traffic.`,
        };
      }

      case "campaign_built": {
        const platform = await pickCampaignPlatform(supabase, business.id);
        const budget = monthlyBudget > 0 ? Math.round(monthlyBudget / 30) : 20;
        const created = await createCampaign(supabase, user.id, {
          businessId: business.id,
          platform,
          budget,
          goal: "lead_generation",
          location: location || null,
          status: "draft",
        });
        if (!created.success) {
          return { status: "error", title: "Couldn't draft the campaign", detail: created.error };
        }
        revalidatePath("/dashboard");
        return {
          status: "done",
          title: "Lead-gen campaign drafted",
          detail: `A ${platform} campaign is drafted at ~$${budget}/day targeting ${
            location || "your area"
          }. Review and launch it whenever you're ready.`,
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

async function activateAgentStack(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  agentTypes: AgentType[],
  override?: { title: string; detail: string },
): Promise<SetupStepResult> {
  const activated: AgentType[] = [];
  for (const agentType of agentTypes) {
    const result = await activateAgent(supabase, userId, agentType);
    if (result.success) {
      activated.push(agentType);
    }
  }

  if (activated.length === 0) {
    return {
      status: "error",
      title: "Couldn't activate agents",
      detail: "None of the recommended agents could be turned on. Please try again.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/agents");
  revalidatePath("/dashboard/automations");

  if (override) return { status: "done", ...override };

  const names = activated.map(AGENT_LABELS).join(", ");
  return {
    status: "done",
    title: `${activated.length} agent${activated.length > 1 ? "s" : ""} activated`,
    detail: `${names} ${activated.length > 1 ? "are" : "is"} now live and working in the background.`,
  };
}

function AGENT_LABELS(type: AgentType): string {
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
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
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
