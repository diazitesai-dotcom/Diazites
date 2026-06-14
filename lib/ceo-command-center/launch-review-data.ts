import { createBusinessRepository } from "@/repositories/business.repository";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/session";
import { AGENTS } from "@/utils/constants";

export type LaunchReviewStatus = "active" | "paused" | "draft" | "needs_review" | "not_connected";

export type LaunchReviewSection = {
  id: string;
  title: string;
  status: LaunchReviewStatus;
  created: string;
  description: string;
  editHref: string;
};

export type LaunchReviewData = {
  businessId: string;
  launchStatus: "active" | "paused";
  businessName: string;
  sections: LaunchReviewSection[];
};

type OnboardingRow = {
  stage: string | null;
  status: string | null;
  business_name: string | null;
  website: string | null;
  service_area: string | null;
  services: string | null;
  monthly_budget: number | null;
  profile_data: Record<string, unknown> | null;
  checklist: Record<string, boolean> | null;
};

function textValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function listValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }
  return [];
}

function statusFromBoolean(value: boolean | undefined, fallback: LaunchReviewStatus): LaunchReviewStatus {
  if (value === true) return "active";
  if (value === false) return fallback;
  return fallback;
}

export async function loadLaunchReviewData(): Promise<LaunchReviewData | null> {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business) return null;

  const { data: onboarding } = await supabase
    .from("onboarding")
    .select("stage, status, business_name, website, service_area, services, monthly_budget, profile_data, checklist")
    .eq("user_id", user.id)
    .maybeSingle<OnboardingRow>();

  const { data: landingPages } = await supabase
    .from("landing_pages")
    .select("id, slug, headline, published")
    .eq("business_id", business.id);

  const { data: workflows } = await supabase
    .from("diazites_workflows")
    .select("id, status")
    .eq("business_id", business.id);

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, status")
    .eq("business_id", business.id);

  const { data: adCampaigns } = await supabase
    .from("ad_campaigns")
    .select("id, status")
    .eq("business_id", business.id);

  const { data: connections } = await supabase
    .from("ad_accounts")
    .select("id, platform, status")
    .eq("business_id", business.id);

  const { data: agentRows } = await supabase
    .from("agents")
    .select("agent_type, status")
    .eq("business_id", business.id);

  const profileData = onboarding?.profile_data ?? {};
  const checklist = onboarding?.checklist ?? {};
  const selectedAgents = listValue(profileData.selectedAgents);
  const agentCount = agentRows?.filter((agent) => agent.status === "active").length ?? 0;
  const connectedCount = connections?.filter((connection) => connection.status === "connected").length ?? 0;
  const liveCampaignCount = [
    ...(campaigns ?? []),
    ...(adCampaigns ?? []),
  ].filter((campaign) => campaign.status === "active").length;
  const activeWorkflowCount = workflows?.filter((workflow) => workflow.status === "active").length ?? 0;
  const landingPage = landingPages?.[0];
  const paused = onboarding?.status === "paused";
  const monthlyBudget = Number(onboarding?.monthly_budget ?? 0);
  const mainOffer = textValue(profileData.mainOffer) || textValue(profileData.offerPromotion);
  const monthlyTarget = textValue(profileData.monthlyTarget);
  const conversionAction = textValue(profileData.preferredConversionAction).replace(/_/g, " ");
  const campaignGoal = textValue(profileData.campaignGoal).replace(/_/g, " ");

  return {
    businessId: business.id,
    launchStatus: paused ? "paused" : "active",
    businessName: business.name,
    sections: [
      {
        id: "business-profile",
        title: "Business Profile Summary",
        status: statusFromBoolean(checklist.profile_complete, "needs_review"),
        created: onboarding?.business_name || business.name,
        description:
          onboarding?.services || onboarding?.service_area
            ? `${onboarding.services || "Services"} for ${onboarding.service_area || "your service area"}.`
            : "Your core business profile is saved for the AI system.",
        editHref: "/onboarding?step=business_profile",
      },
      {
        id: "offer-goal",
        title: "Offer & Goal Summary",
        status: mainOffer || monthlyTarget || campaignGoal ? "active" : "needs_review",
        created: mainOffer || campaignGoal || "Primary offer and conversion goal",
        description:
          monthlyTarget || conversionAction
            ? `Target: ${monthlyTarget || "Not set"}${conversionAction ? ` through ${conversionAction}` : ""}.`
            : "Add a clear offer and goal so agents know what outcome to optimize.",
        editHref: "/onboarding?step=offer_goals",
      },
      {
        id: "landing-page",
        title: "Landing Page Summary",
        status: landingPage?.published ? "active" : landingPage ? "draft" : "needs_review",
        created: landingPage?.headline || landingPage?.slug || "No landing page has been created yet.",
        description: landingPage
          ? "Your funnel page exists and can be reviewed or edited from onboarding Step 3."
          : "No landing page has been created yet. Edit Step 3 to finish this.",
        editHref: "/onboarding?step=landing_pages",
      },
      {
        id: "pipeline-workflow",
        title: "Pipeline & Workflow Summary",
        status: activeWorkflowCount > 0 ? "active" : workflows?.length ? "paused" : "needs_review",
        created:
          activeWorkflowCount > 0
            ? `${activeWorkflowCount} active workflow${activeWorkflowCount === 1 ? "" : "s"}`
            : "Lead pipeline and follow-up workflow",
        description:
          workflows?.length || checklist.campaign_built
            ? "Lead follow-up, booking, and nurture steps are configured for this account."
            : "No workflow has been activated yet. Edit Step 4 to define what happens after conversion.",
        editHref: "/onboarding?step=pipeline_workflow",
      },
      {
        id: "connected-accounts",
        title: "Connected Accounts Summary",
        status: connectedCount > 0 ? "active" : "not_connected",
        created:
          connectedCount > 0
            ? `${connectedCount} connected account${connectedCount === 1 ? "" : "s"}`
            : "No connected ad or campaign accounts yet.",
        description:
          connectedCount > 0
            ? "Connected tools are available for campaigns, tracking, and reporting."
            : "Connect accounts when you are ready for live campaign activity.",
        editHref: "/onboarding?step=connect_accounts",
      },
      {
        id: "ai-agents",
        title: "AI Agents Summary",
        status: paused ? "paused" : agentCount > 0 ? "active" : selectedAgents.length > 0 ? "draft" : "needs_review",
        created:
          agentCount > 0
            ? `${agentCount} active AI agent${agentCount === 1 ? "" : "s"}`
            : selectedAgents.length > 0
              ? `${selectedAgents.length} selected agent${selectedAgents.length === 1 ? "" : "s"}`
              : `${AGENTS.length} available agents`,
        description: paused
          ? "AI agent activity is currently paused for this business."
          : "AI agents are prepared to support lead capture, follow-up, workflows, and campaigns.",
        editHref: "/onboarding?step=ai_agents",
      },
      {
        id: "campaign-tracking",
        title: "Campaign / Tracking Summary",
        status: liveCampaignCount > 0 ? "active" : paused ? "paused" : "draft",
        created:
          liveCampaignCount > 0
            ? `${liveCampaignCount} live campaign${liveCampaignCount === 1 ? "" : "s"}`
            : "Campaign and tracking setup",
        description:
          monthlyBudget > 0
            ? `Campaign budget context is saved at $${monthlyBudget.toLocaleString()} for reporting and optimization.`
            : "Tracking and campaign activity will show here once connected accounts and campaigns are active.",
        editHref: "/onboarding?step=tracking",
      },
      {
        id: "launch-status",
        title: "Launch Status",
        status: paused ? "paused" : onboarding?.stage === "live" ? "active" : "needs_review",
        created: paused ? "Full setup paused" : "Full setup launched",
        description: paused
          ? "Your setup is saved, but agents, automations, campaigns, and tool activity are stopped."
          : "Your AI business system is live and ready for review after launch.",
        editHref: "/onboarding?step=launch",
      },
    ],
  };
}
