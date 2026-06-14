import { createBusinessRepository } from "@/repositories/business.repository";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/session";
import { AGENTS } from "@/utils/constants";

export type LaunchReviewStatus = "active" | "paused" | "draft" | "needs_review" | "not_connected";
export type LaunchReviewAccent =
  | "blue"
  | "green"
  | "purple"
  | "amber"
  | "cyan"
  | "violet"
  | "pink"
  | "orange"
  | "slate"
  | "emerald"
  | "red";
export type LaunchReviewControl = {
  state: "can_pause" | "can_activate" | "full_setup_only" | "edit_required";
  label: string;
  description: string;
};

export type LaunchReviewSection = {
  id: string;
  stepNumber: number;
  title: string;
  status: LaunchReviewStatus;
  accent: LaunchReviewAccent;
  created: string;
  description: string;
  editHref: string;
  control: LaunchReviewControl;
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

function controlForStatus(
  status: LaunchReviewStatus,
  options?: { fullSetupOnly?: boolean; editRequired?: boolean },
): LaunchReviewControl {
  if (options?.editRequired || status === "draft" || status === "needs_review" || status === "not_connected") {
    return {
      state: "edit_required",
      label: "Edit First",
      description: "Finish this setup step before it can be activated.",
    };
  }

  if (options?.fullSetupOnly) {
    return {
      state: "full_setup_only",
      label: "Full Setup Control",
      description: "This step is controlled by the full setup pause or activate button.",
    };
  }

  if (status === "paused") {
    return {
      state: "can_activate",
      label: "Activate",
      description: "This can be turned back on by activating the full setup.",
    };
  }

  return {
    state: "can_pause",
    label: "Pause",
    description: "Use the full setup pause button to stop this safely.",
  };
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
  const campaignCount = (campaigns?.length ?? 0) + (adCampaigns?.length ?? 0);
  const activeWorkflowCount = workflows?.filter((workflow) => workflow.status === "active").length ?? 0;
  const landingPage = landingPages?.[0];
  const paused = onboarding?.status === "paused";
  const monthlyBudget = Number(onboarding?.monthly_budget ?? 0);
  const mainOffer = textValue(profileData.mainOffer) || textValue(profileData.offerPromotion);
  const monthlyTarget = textValue(profileData.monthlyTarget);
  const conversionAction = textValue(profileData.preferredConversionAction).replace(/_/g, " ");
  const campaignGoal = textValue(profileData.campaignGoal).replace(/_/g, " ");
  const trackingConnections =
    connections?.filter((connection) =>
      ["ga4", "meta_pixel", "gtm"].includes(String(connection.platform)),
    ) ?? [];
  const activeTrackingCount = trackingConnections.filter(
    (connection) => connection.status === "connected",
  ).length;
  const launchStatus: LaunchReviewStatus = paused
    ? "paused"
    : onboarding?.stage === "live"
      ? "active"
      : "needs_review";

  return {
    businessId: business.id,
    launchStatus: paused ? "paused" : "active",
    businessName: business.name,
    sections: [
      {
        id: "business-profile",
        stepNumber: 1,
        title: "Business Profile",
        status: statusFromBoolean(checklist.profile_complete, "needs_review"),
        accent: "blue",
        created: onboarding?.business_name || business.name,
        description:
          onboarding?.services || onboarding?.service_area
            ? `${onboarding.services || "Services"} for ${onboarding.service_area || "your service area"}.`
            : "Your core business profile is saved for the AI system.",
        editHref: "/onboarding?step=business_profile",
        control: controlForStatus(statusFromBoolean(checklist.profile_complete, "needs_review"), {
          fullSetupOnly: true,
        }),
      },
      {
        id: "offer-goal",
        stepNumber: 2,
        title: "Offer & Goals",
        status: mainOffer || monthlyTarget || campaignGoal ? (paused ? "paused" : "active") : "needs_review",
        accent: "green",
        created: mainOffer || campaignGoal || "Primary offer and conversion goal",
        description:
          monthlyTarget || conversionAction
            ? `Target: ${monthlyTarget || "Not set"}${conversionAction ? ` through ${conversionAction}` : ""}.`
            : "Add a clear offer and goal so agents know what outcome to optimize.",
        editHref: "/onboarding?step=offer_goals",
        control: controlForStatus(
          mainOffer || monthlyTarget || campaignGoal ? (paused ? "paused" : "active") : "needs_review",
          { fullSetupOnly: true },
        ),
      },
      {
        id: "landing-page",
        stepNumber: 3,
        title: "Landing Page Builder",
        status: paused && landingPage ? "paused" : landingPage?.published ? "active" : landingPage ? "draft" : "needs_review",
        accent: "purple",
        created: landingPage?.headline || landingPage?.slug || "No landing page has been created yet.",
        description: landingPage
          ? "Your funnel page exists and can be reviewed or edited from onboarding Step 3."
          : "No landing page has been created yet. Edit Step 3 to finish this.",
        editHref: "/onboarding?step=landing_pages",
        control: controlForStatus(
          paused && landingPage ? "paused" : landingPage?.published ? "active" : landingPage ? "draft" : "needs_review",
          { fullSetupOnly: true },
        ),
      },
      {
        id: "pipeline-workflow",
        stepNumber: 4,
        title: "Pipeline & Workflow",
        status: paused && workflows?.length ? "paused" : activeWorkflowCount > 0 ? "active" : workflows?.length ? "draft" : "needs_review",
        accent: "amber",
        created:
          activeWorkflowCount > 0
            ? `${activeWorkflowCount} active workflow${activeWorkflowCount === 1 ? "" : "s"}`
            : "Lead pipeline and follow-up workflow",
        description:
          workflows?.length || checklist.campaign_built
            ? "Lead follow-up, booking, and nurture steps are configured for this account."
            : "No workflow has been activated yet. Edit Step 4 to define what happens after conversion.",
        editHref: "/onboarding?step=pipeline_workflow",
        control: controlForStatus(
          paused && workflows?.length ? "paused" : activeWorkflowCount > 0 ? "active" : workflows?.length ? "draft" : "needs_review",
          { fullSetupOnly: true },
        ),
      },
      {
        id: "connected-accounts",
        stepNumber: 5,
        title: "Connected Accounts",
        status: connectedCount > 0 ? "active" : "not_connected",
        accent: "cyan",
        created:
          connectedCount > 0
            ? `${connectedCount} connected account${connectedCount === 1 ? "" : "s"}`
            : "No connected ad or campaign accounts yet.",
        description:
          connectedCount > 0
            ? "Connected tools are available for campaigns, tracking, and reporting."
            : "Connect accounts when you are ready for live campaign activity.",
        editHref: "/onboarding?step=connect_accounts",
        control: controlForStatus(connectedCount > 0 ? "active" : "not_connected", {
          fullSetupOnly: connectedCount > 0,
        }),
      },
      {
        id: "ai-agents",
        stepNumber: 6,
        title: "AI Agents",
        status: paused ? "paused" : agentCount > 0 ? "active" : selectedAgents.length > 0 ? "draft" : "needs_review",
        accent: "violet",
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
        control: controlForStatus(
          paused ? "paused" : agentCount > 0 ? "active" : selectedAgents.length > 0 ? "draft" : "needs_review",
          { fullSetupOnly: true },
        ),
      },
      {
        id: "ads-campaign",
        stepNumber: 7,
        title: "Ads Agent / Campaign",
        status: paused && campaignCount > 0 ? "paused" : liveCampaignCount > 0 ? "active" : campaignCount > 0 ? "draft" : "needs_review",
        accent: "pink",
        created:
          liveCampaignCount > 0
            ? `${liveCampaignCount} live campaign${liveCampaignCount === 1 ? "" : "s"}`
            : campaignCount > 0
              ? `${campaignCount} campaign draft${campaignCount === 1 ? "" : "s"}`
              : "No campaign has been launched yet.",
        description:
          monthlyBudget > 0
            ? `Campaign budget context is saved at $${monthlyBudget.toLocaleString()} for launch and optimization.`
            : "Create or connect a campaign so the Ads Agent knows what to run.",
        editHref: "/onboarding?step=ads_agent",
        control: controlForStatus(
          paused && campaignCount > 0 ? "paused" : liveCampaignCount > 0 ? "active" : campaignCount > 0 ? "draft" : "needs_review",
          { fullSetupOnly: true },
        ),
      },
      {
        id: "tracking",
        stepNumber: 8,
        title: "Tracking",
        status: activeTrackingCount > 0 ? "active" : trackingConnections.length > 0 ? "draft" : "not_connected",
        accent: "orange",
        created:
          activeTrackingCount > 0
            ? `${activeTrackingCount} tracking platform${activeTrackingCount === 1 ? "" : "s"} connected`
            : "Tracking is not connected yet.",
        description:
          activeTrackingCount > 0
            ? "Tracking is ready to help your dashboard show real campaign and conversion results."
            : "Tracking is not connected yet. Add tracking so your dashboard can show real results.",
        editHref: "/onboarding?step=tracking",
        control: controlForStatus(activeTrackingCount > 0 ? "active" : trackingConnections.length > 0 ? "draft" : "not_connected", {
          fullSetupOnly: activeTrackingCount > 0,
        }),
      },
      {
        id: "review",
        stepNumber: 9,
        title: "Review",
        status: onboarding?.status === "paused" ? "paused" : onboarding?.status === "completed" ? "active" : "needs_review",
        accent: "slate",
        created: onboarding?.status === "completed" ? "Setup reviewed and saved" : "Review your setup before launch.",
        description:
          onboarding?.status === "completed" || onboarding?.status === "paused"
            ? "Your onboarding answers were saved and are ready for review at any time."
            : "Review all setup steps so the launch has the correct business details.",
        editHref: "/onboarding?step=review",
        control: controlForStatus(
          onboarding?.status === "paused" ? "paused" : onboarding?.status === "completed" ? "active" : "needs_review",
          { fullSetupOnly: true },
        ),
      },
      {
        id: "launch-status",
        stepNumber: 10,
        title: "Launch Status",
        status: launchStatus,
        accent: paused ? "red" : "emerald",
        created: paused ? "Full setup paused" : "Full setup launched",
        description: paused
          ? "Your setup is saved, but agents, automations, campaigns, and tool activity are stopped."
          : "Your AI business system is live and ready for review after launch.",
        editHref: "/onboarding?step=launch",
        control: controlForStatus(launchStatus, { fullSetupOnly: true }),
      },
    ],
  };
}
