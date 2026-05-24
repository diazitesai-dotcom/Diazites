import type { OrchestrationRunStatus } from "@/lib/dashboard/orchestration-status";
import type { AutonomousMode, DeploymentConfig, TimelineEvent } from "@/types/agent-deployment";
import type { AgentType } from "@/types/domain";

export type AgentDeploymentPresetId = "retargeting";

export type AgentDeploymentPreset = {
  id: AgentDeploymentPresetId;
  agent: AgentType;
  goal: import("@/types/agent-deployment").DeploymentGoalId;
  title: string;
  expectedUplift: string;
  audience: string;
  budgetDaily: string;
  sequence: string;
  whyItMatters: string[];
  config: Partial<DeploymentConfig>;
  defaultMode: AutonomousMode;
  growthTimeline: {
    time: string;
    label: string;
    kind: TimelineEvent["kind"];
    status: OrchestrationRunStatus;
    durationSeconds?: number;
    system?: string;
  }[];
  aiActionsToday: {
    automationsExecuted: number;
    optimizationsApplied: number;
    opportunitiesDeployed: number;
  };
};

export const RETARGETING_DEPLOYMENT_PRESET: AgentDeploymentPreset = {
  id: "retargeting",
  agent: "retargeting",
  goal: "improve_conversion",
  title: "Retargeting Agent Deployment",
  expectedUplift: "+12–18% recovered leads",
  audience: "Recent landing page visitors",
  budgetDaily: "$5/day",
  sequence: "3-touch follow-up",
  whyItMatters: [
    "Recent visitors returned multiple times but no follow-up automation exists.",
    "Traffic spike detected from direct/referral traffic.",
    "Lead velocity slowing Sunday–Tuesday.",
  ],
  config: {
    budget: "5",
    platform: "meta",
    audience: "Recent landing page visitors · 7-day window",
    offer: "Free roof inspection — limited slots",
    cta: "Claim Your Spot",
    brandVoice: "Urgent but trustworthy — local expert tone",
  },
  defaultMode: "autonomous",
  growthTimeline: [
    {
      time: "09:02",
      label: "Landing page generated",
      kind: "asset",
      status: "completed",
      durationSeconds: 38,
      system: "Landing Stack",
    },
    {
      time: "09:04",
      label: "Meta campaign deployed",
      kind: "campaign",
      status: "running",
      durationSeconds: 42,
      system: "Paid Ads Stack",
    },
    {
      time: "09:06",
      label: "Pixel validation",
      kind: "deployment",
      status: "failed",
      durationSeconds: 12,
      system: "Paid Ads Stack",
    },
    {
      time: "09:10",
      label: "Follow-up triggered",
      kind: "execution",
      status: "completed",
      durationSeconds: 6,
      system: "Lead Recovery Stack",
    },
    {
      time: "09:14",
      label: "AI optimization applied",
      kind: "execution",
      status: "processing",
      durationSeconds: 24,
      system: "Optimization Loop",
    },
  ],
  aiActionsToday: {
    automationsExecuted: 12,
    optimizationsApplied: 3,
    opportunitiesDeployed: 2,
  },
};

export function getDeploymentPreset(id: AgentDeploymentPresetId): AgentDeploymentPreset {
  if (id === "retargeting") return RETARGETING_DEPLOYMENT_PRESET;
  return RETARGETING_DEPLOYMENT_PRESET;
}

export function presetToTimelineEvents(
  preset: AgentDeploymentPreset,
  date = new Date(),
): TimelineEvent[] {
  const day = date.toISOString().slice(0, 10);
  return preset.growthTimeline.map((row, i) => ({
    id: `preset-${preset.id}-${i}`,
    at: `${day}T${row.time}:00`,
    kind: row.kind,
    title: row.label,
    detail: "Growth Engine orchestration",
  }));
}
