import type { EntitlementKey, UpgradePromptContext } from "@/types/entitlements";

const MESSAGES: Partial<
  Record<EntitlementKey | string, Omit<UpgradePromptContext, "featureKey">>
> = {
  ad_accounts: {
    title: "Upgrade to unlock more growth tools",
    message:
      "Starter includes 1 connected ad platform. Upgrade to Growth to connect more ad accounts and run multi-platform campaigns.",
    requiredPlan: "growth",
  },
  ad_platforms: {
    title: "Upgrade to unlock more growth tools",
    message:
      "Starter includes 1 connected ad platform. Upgrade to Growth to connect Meta and Google (and more) at the same time.",
    requiredPlan: "growth",
  },
  ads_agent_full: {
    title: "Upgrade to unlock more growth tools",
    message:
      "Starter includes Ads Agent Lite. Upgrade to Growth to activate the full Ads Agent with advanced campaign automation.",
    requiredPlan: "growth",
  },
  ai_voice_minutes: {
    title: "Upgrade to unlock more growth tools",
    message:
      "Starter includes 100 AI voice minutes and 25 outbound calls per month. Upgrade to Growth for more call capacity.",
    requiredPlan: "growth",
  },
  outbound_ai_calls: {
    title: "Upgrade to unlock more growth tools",
    message:
      "Starter includes 25 outbound AI calls per month. Upgrade to Growth for higher outbound limits.",
    requiredPlan: "growth",
  },
  workflows: {
    title: "Upgrade to unlock more growth tools",
    message:
      "Starter includes 5 active workflows. Upgrade to Growth for more automation capacity.",
    requiredPlan: "growth",
  },
  landing_pages: {
    title: "Upgrade to unlock more growth tools",
    message:
      "Starter includes 1 landing page. Upgrade to Growth to publish more capture pages.",
    requiredPlan: "growth",
  },
  zapier_advanced: {
    title: "Upgrade to unlock more growth tools",
    message:
      "Advanced integrations are available on Growth and Pro. Upgrade to connect external apps, custom APIs, webhooks, and MCP tools.",
    requiredPlan: "growth",
  },
  external_api_access: {
    title: "Upgrade to unlock more growth tools",
    message:
      "Advanced integrations require Growth or Pro. Upgrade to connect external apps, custom APIs, webhooks, and MCP tools.",
    requiredPlan: "growth",
  },
  mcp_connectors: {
    title: "Upgrade to unlock more growth tools",
    message:
      "MCP connectors are available on Pro and Enterprise. Upgrade to wire custom AI toolchains.",
    requiredPlan: "pro",
  },
  white_label: {
    title: "Upgrade to unlock more growth tools",
    message: "White label branding is available on Pro and Enterprise.",
    requiredPlan: "pro",
  },
  team_permissions: {
    title: "Upgrade to unlock more growth tools",
    message: "Team permissions and advanced seats are available on Pro and Enterprise.",
    requiredPlan: "pro",
  },
};

export function showUpgradeRequired(
  featureKey: EntitlementKey | string,
  requiredPlan: UpgradePromptContext["requiredPlan"] = "growth",
): UpgradePromptContext {
  const preset = MESSAGES[featureKey];
  return {
    featureKey,
    title: preset?.title ?? "Upgrade to unlock more growth tools",
    message:
      preset?.message ??
      "This feature is not included in your current plan. Upgrade to unlock more agents, integrations, and automation limits.",
    requiredPlan: preset?.requiredPlan ?? requiredPlan,
  };
}
