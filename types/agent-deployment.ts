import type { AgentType } from "@/types/domain";

export type DeploymentGoalId =
  | "generate_leads"
  | "launch_ads"
  | "build_landing_page"
  | "book_appointments"
  | "retarget_visitors"
  | "automate_follow_up"
  | "full_growth_engine";

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

export type ReadinessCheckId = "crm" | "ads" | "pixel" | "domain" | "analytics" | "billing";

export type ReadinessItem = {
  id: ReadinessCheckId;
  label: string;
  ok: boolean;
  detail: string;
  href: string;
};

export type DeploymentConfig = {
  budget: string;
  platform: string;
  audience: string;
  offer: string;
  cta: string;
  brandVoice: string;
};

export type TimelineEvent = {
  id: string;
  at: string;
  kind: "deployment" | "asset" | "campaign" | "lead";
  title: string;
  detail: string;
};

export type LiveMonitoringSnapshot = {
  traffic: string;
  leadVelocity: string;
  agentHealth: string;
  optimizationStatus: string;
};

export type AgentDeploymentContext = {
  readiness: ReadinessItem[];
  monitoring: LiveMonitoringSnapshot;
};

export type DeployStackResult =
  | { ok: true; activated: AgentType[]; timeline: TimelineEvent[] }
  | { ok: false; error: string };

export const DEPLOYMENT_GOALS: {
  id: DeploymentGoalId;
  label: string;
  description: string;
}[] = [
  { id: "generate_leads", label: "Generate Leads", description: "Capture and qualify inbound demand" },
  { id: "launch_ads", label: "Launch Ads", description: "Paid acquisition across Meta & Google" },
  { id: "build_landing_page", label: "Build Landing Page", description: "High-converting funnel assets" },
  { id: "book_appointments", label: "Book Appointments", description: "Route leads to booked calls" },
  { id: "retarget_visitors", label: "Retarget Visitors", description: "Recover warm site traffic" },
  { id: "automate_follow_up", label: "Automate Follow-Up", description: "AI sequences on new leads" },
  {
    id: "full_growth_engine",
    label: "Full Growth Engine",
    description: "End-to-end research, creative, funnel & launch",
  },
];

export const AGENT_STACKS: {
  id: AgentStackId;
  label: string;
  description: string;
  agents: AgentType[];
  setupMinutes: number;
  impact: string;
}[] = [
  {
    id: "lead_engine",
    label: "Lead Engine Stack",
    description: "Landing page, qualification, and follow-up",
    agents: ["landing_page", "lead_qualification", "ai_follow_up"],
    setupMinutes: 8,
    impact: "+22–35% qualified lead volume",
  },
  {
    id: "paid_ads",
    label: "Paid Ads Stack",
    description: "Social, search, and retargeting loop",
    agents: ["social_ads", "search_ads", "retargeting"],
    setupMinutes: 12,
    impact: "+18–28% reach at target CPL",
  },
  {
    id: "growth_engine",
    label: "Growth Engine Stack",
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
  },
];
