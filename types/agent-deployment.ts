import type { AgentType } from "@/types/domain";

export type DeploymentGoalId =
  | "generate_leads"
  | "launch_ads"
  | "build_landing_page"
  | "improve_conversion"
  | "follow_up_leads"
  | "deploy_full_growth_engine";

export type AgentLifecycleState =
  | "draft"
  | "configuring"
  | "ready"
  | "deploying"
  | "live"
  | "learning"
  | "error";

export type AutonomousMode = "manual" | "guided" | "autonomous";

export type AgentStackId = "lead_engine" | "paid_ads" | "growth_engine";

export type ReadinessCheckId = "crm" | "billing" | "domain" | "pixel" | "ads" | "analytics";

export type ReadinessItem = {
  id: ReadinessCheckId;
  label: string;
  ok: boolean;
  detail: string;
  href: string;
  settingsHref?: string;
};

export type DeploymentConfig = {
  budget: string;
  platform: string;
  audience: string;
  offer: string;
  cta: string;
  brandVoice: string;
};

export type TimelineEventKind =
  | "deployment"
  | "asset"
  | "campaign"
  | "lead"
  | "execution";

export type TimelineEvent = {
  id: string;
  at: string;
  kind: TimelineEventKind;
  title: string;
  detail: string;
};

export type LiveMonitoringSnapshot = {
  traffic: string;
  leadVelocity: string;
  agentHealth: string;
  optimizationScore: string;
};

export type StackFlowNode = {
  id: string;
  agentType: AgentType;
  label: string;
  role: string;
};

export type StackFlowEdge = {
  from: string;
  to: string;
  label?: string;
};

export type StackFlowGraph = {
  nodes: StackFlowNode[];
  edges: StackFlowEdge[];
};

export type AgentDeploymentContext = {
  readiness: ReadinessItem[];
  monitoring: LiveMonitoringSnapshot;
  prefill: DeploymentConfig;
  expectedUplift: string;
};

export type DeployStackResult =
  | { ok: true; activated: AgentType[]; timeline: TimelineEvent[] }
  | { ok: false; error: string };

export type DeploymentLaunchSource =
  | "activate_agent"
  | "command_briefing"
  | "recommended_action"
  | "growth_engine"
  | "quick_action"
  | "opportunity"
  | "recommendation";

export type DeploymentLaunchParams = {
  goal?: DeploymentGoalId;
  stack?: AgentStackId;
  agent?: AgentType;
  source?: DeploymentLaunchSource;
  step?: "goal" | "stack" | "config" | "readiness";
};

export const DEPLOYMENT_GOALS: {
  id: DeploymentGoalId;
  label: string;
  description: string;
  uplift: string;
}[] = [
  {
    id: "generate_leads",
    label: "Generate Leads",
    description: "Capture and qualify inbound demand",
    uplift: "+22–35% qualified leads",
  },
  {
    id: "launch_ads",
    label: "Launch Ads",
    description: "Paid acquisition across Meta & Google",
    uplift: "+18–28% reach at target CPL",
  },
  {
    id: "build_landing_page",
    label: "Build Landing Page",
    description: "High-converting funnel assets",
    uplift: "+12–24% landing conversion",
  },
  {
    id: "improve_conversion",
    label: "Improve Conversion",
    description: "Optimize funnel, offers, and retargeting",
    uplift: "+15–30% funnel efficiency",
  },
  {
    id: "follow_up_leads",
    label: "Follow Up Leads",
    description: "AI sequences and qualification on pipeline",
    uplift: "+20–32% response rate",
  },
  {
    id: "deploy_full_growth_engine",
    label: "Deploy Full Growth Engine",
    description: "End-to-end research, creative, funnel & launch",
    uplift: "+25–40% full-funnel lift",
  },
];

export const AGENT_STACKS: {
  id: AgentStackId;
  label: string;
  description: string;
  agents: AgentType[];
  setupMinutes: number;
  impact: string;
  uplift: string;
}[] = [
  {
    id: "lead_engine",
    label: "Lead Engine",
    description: "Landing page, qualification, and follow-up",
    agents: ["landing_page", "lead_qualification", "ai_follow_up"],
    setupMinutes: 8,
    impact: "Inbound capture orchestration",
    uplift: "+22–35% qualified lead volume",
  },
  {
    id: "paid_ads",
    label: "Paid Ads",
    description: "Social, search, and retargeting loop",
    agents: ["social_ads", "search_ads", "retargeting"],
    setupMinutes: 12,
    impact: "Paid acquisition loop",
    uplift: "+18–28% reach at target CPL",
  },
  {
    id: "growth_engine",
    label: "Growth Engine",
    description: "Full agent orchestration for scale",
    agents: [
      "social_ads",
      "search_ads",
      "landing_page",
      "lead_qualification",
      "ai_follow_up",
      "retargeting",
    ],
    setupMinutes: 15,
    impact: "Full-funnel AI operating system",
    uplift: "+25–40% pipeline lift",
  },
];

/** Legacy goal ids from earlier deploy URLs */
export function normalizeDeploymentGoalId(
  raw: string | null | undefined,
): DeploymentGoalId | undefined {
  if (!raw) return undefined;
  const map: Record<string, DeploymentGoalId> = {
    book_appointments: "follow_up_leads",
    retarget_visitors: "improve_conversion",
    automate_follow_up: "follow_up_leads",
    full_growth_engine: "deploy_full_growth_engine",
  };
  if (raw in map) return map[raw];
  return DEPLOYMENT_GOALS.some((g) => g.id === raw) ? (raw as DeploymentGoalId) : undefined;
}
