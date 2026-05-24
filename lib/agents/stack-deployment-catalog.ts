import type { AutonomousMode } from "@/types/agent-deployment";
import type { AgentStackId } from "@/types/agent-deployment";
import { AGENT_STACKS } from "@/types/agent-deployment";
import type { AgentType } from "@/types/domain";

export type StackHealth = "ready" | "partial" | "setup";

export type StackComponentStatus = "ok" | "warn" | "missing";

export type StackComponent = {
  id: string;
  label: string;
  agentType?: AgentType;
  status: StackComponentStatus;
};

export type DeployableStackDefinition = {
  id: AgentStackId | "landing";
  label: string;
  healthLabel: StackHealth;
  components: StackComponent[];
  expectedOutcome: string;
  setupMinutes: number;
  launch: {
    goal: import("@/types/agent-deployment").DeploymentGoalId;
    stack?: AgentStackId;
  };
};

export const MODE_GUARDRAILS: Record<
  AutonomousMode,
  { label: string; enabled: boolean }[]
> = {
  manual: [
    { label: "Max spend: $25/day", enabled: true },
    { label: "Human approval for new campaigns", enabled: true },
    { label: "Auto-optimization enabled", enabled: false },
    { label: "Rollback available", enabled: true },
  ],
  guided: [
    { label: "Max spend: $25/day", enabled: true },
    { label: "Human approval for new campaigns", enabled: true },
    { label: "Auto-optimization enabled", enabled: true },
    { label: "Rollback available", enabled: true },
  ],
  autonomous: [
    { label: "Max spend: $25/day", enabled: true },
    { label: "Human approval for new campaigns", enabled: false },
    { label: "Auto-optimization enabled", enabled: true },
    { label: "Rollback available", enabled: true },
  ],
};

function agentStatus(
  agents: { agent_type: string; status: string }[],
  type: AgentType,
): StackComponentStatus {
  const row = agents.find((a) => a.agent_type === type);
  if (!row || row.status === "inactive") return "missing";
  if (row.status === "pending") return "warn";
  return "ok";
}

function stackHealth(components: StackComponent[]): StackHealth {
  const missing = components.filter((c) => c.status === "missing").length;
  const warn = components.filter((c) => c.status === "warn").length;
  if (missing === 0 && warn === 0) return "ready";
  if (missing >= components.length - 1) return "setup";
  return "partial";
}

export function buildDeployableStacks(
  agents: { agent_type: string; status: string }[],
): DeployableStackDefinition[] {
  const leadComponents: StackComponent[] = [
    { id: "landing", label: "Landing", agentType: "landing_page", status: agentStatus(agents, "landing_page") },
    {
      id: "qualify",
      label: "Qualification",
      agentType: "lead_qualification",
      status: agentStatus(agents, "lead_qualification"),
    },
    {
      id: "followup",
      label: "Follow-Up",
      agentType: "ai_follow_up",
      status: agentStatus(agents, "ai_follow_up"),
    },
    {
      id: "crm",
      label: "CRM",
      status:
        agentStatus(agents, "ai_follow_up") === "ok" && agentStatus(agents, "lead_qualification") === "ok"
          ? "ok"
          : "warn",
    },
  ];

  const adsComponents: StackComponent[] = [
    { id: "meta", label: "Meta", agentType: "social_ads", status: agentStatus(agents, "social_ads") },
    { id: "search", label: "Search", agentType: "search_ads", status: agentStatus(agents, "search_ads") },
    {
      id: "retarget",
      label: "Retargeting",
      agentType: "retargeting",
      status: agentStatus(agents, "retargeting"),
    },
    {
      id: "analytics",
      label: "Analytics",
      status:
        agentStatus(agents, "social_ads") === "ok" || agentStatus(agents, "search_ads") === "ok"
          ? "ok"
          : "warn",
    },
  ];

  const landingComponents: StackComponent[] = [
    { id: "landing", label: "Landing", agentType: "landing_page", status: agentStatus(agents, "landing_page") },
    {
      id: "qualify",
      label: "Qualification",
      agentType: "lead_qualification",
      status: agentStatus(agents, "lead_qualification"),
    },
  ];

  const leadStack = AGENT_STACKS.find((s) => s.id === "lead_engine")!;
  const adsStack = AGENT_STACKS.find((s) => s.id === "paid_ads")!;

  return [
    {
      id: "lead_engine",
      label: "Lead Engine",
      healthLabel: stackHealth(leadComponents),
      components: leadComponents,
      expectedOutcome: "+18–32 leads/mo",
      setupMinutes: leadStack.setupMinutes,
      launch: { goal: "generate_leads", stack: "lead_engine" },
    },
    {
      id: "paid_ads",
      label: "Paid Ads",
      healthLabel: stackHealth(adsComponents),
      components: adsComponents,
      expectedOutcome: adsStack.uplift,
      setupMinutes: adsStack.setupMinutes,
      launch: { goal: "launch_ads", stack: "paid_ads" },
    },
    {
      id: "landing",
      label: "Landing",
      healthLabel: stackHealth(landingComponents),
      components: landingComponents,
      expectedOutcome: "+8–15% funnel conversion lift",
      setupMinutes: 2,
      launch: { goal: "build_landing_page" },
    },
  ];
}

const GROWTH_PREVIEW_LINES: { label: string; agentType?: AgentType }[] = [
  { label: "Landing Agent", agentType: "landing_page" },
  { label: "Qualification", agentType: "lead_qualification" },
  { label: "Follow-Up", agentType: "ai_follow_up" },
  { label: "CRM Routing", agentType: "lead_qualification" },
  { label: "Retargeting", agentType: "retargeting" },
];

export function buildGrowthStackPreview(agents: { agent_type: string; status: string }[]) {
  const growth = AGENT_STACKS.find((s) => s.id === "growth_engine")!;
  const included = GROWTH_PREVIEW_LINES.map((line) => ({
    label: line.label,
    ok: line.agentType ? agentStatus(agents, line.agentType) === "ok" : true,
  }));

  return {
    title: "Growth Stack Preview",
    included,
    budget: "$5–25/day",
    etaMinutes: growth.setupMinutes,
    rollbackEnabled: true,
    expectedOutcome: growth.uplift,
  };
}

export const HEALTH_BADGE: Record<StackHealth, { label: string; className: string }> = {
  ready: { label: "READY", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" },
  partial: { label: "PARTIAL", className: "border-amber-500/30 bg-amber-500/10 text-amber-200" },
  setup: { label: "SETUP", className: "border-sky-500/30 bg-sky-500/10 text-sky-200" },
};

export function componentIcon(status: StackComponentStatus) {
  switch (status) {
    case "ok":
      return "✓";
    case "warn":
      return "⚠";
    default:
      return "○";
  }
}
