import type { OrchestrationRunStatus } from "@/lib/dashboard/orchestration-status";

export type ConnectionStatus = "connected" | "pending" | "missing" | "error";

export type ActivitySeverity = "success" | "warning" | "critical" | "info";

export type CommandCenterKind = "alert" | "warning" | "recommendation";

export type CommandCenterItem = {
  id: string;
  kind: CommandCenterKind;
  title: string;
  detail: string;
  href?: string;
};

export type MissionControlBriefing = {
  leadsCaptured: number;
  campaignStatus: string;
  agentStatus: string;
  missedOpportunity: string;
  recommendedNextAction: string;
  aiInsight: string;
  leverageRecommendation: string;
  expectedImpact: string;
  aiConfidence: number;
  expectedUplift: string;
  riskLevel: "low" | "medium" | "high";
};

export type RevenueForecast = {
  today: number;
  sevenDay: number;
  thirtyDay: number;
  pipelineValue: number;
  confidence: number;
  explanation: string;
};

export type KpiInsight = {
  key: string;
  trafficSource: string;
  periodLabel: string;
  microInsight: string;
};

export type DiagnosticStatus = "healthy" | "warning" | "critical";

export type AiDiagnostic = {
  id: string;
  label: string;
  status: DiagnosticStatus;
  detail: string;
};

export type RecommendedNextAction = {
  title: string;
  impact: string;
  href: string;
  cta: string;
};

export type FunnelDiagnosis = {
  summary: string;
  dropoffStage: string;
  dropoffPercent: number;
  recommendation: string;
};

export type HealthCheck = {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
};

export type FunnelStage = {
  key: string;
  label: string;
  count: number;
  conversionRate: number | null;
  isBottleneck: boolean;
  dropoffPercent: number | null;
};

export type KpiTrend = {
  key: string;
  changePercent: number;
  direction: "up" | "down" | "neutral";
};

export type AiRecommendation = {
  id: string;
  title: string;
  impact: string;
  cta: string;
  href: string;
};

export type OpportunityDeployPreview = {
  title: string;
  audience?: string;
  budget?: string;
  followUp?: string;
  expected?: string;
  channels?: string;
  rollbackAvailable?: boolean;
  estimatedLaunchSeconds?: number;
};

export type OpportunityItem = {
  id: string;
  title: string;
  detail: string;
  impact: string;
  priority: "high" | "medium" | "low";
  cta: string;
  href: string;
  reasoning?: string;
  deployPreview?: OpportunityDeployPreview;
  deployPreset?: "retargeting";
};

export type GoalPacingStatus = "ahead" | "on_track" | "behind";

export type GoalCoaching = {
  blocker: string;
  suggestedMove: string;
};

export type SparkPoint = {
  d: string;
  v: number;
  annotation?: {
    title: string;
    detail: string;
    kind: "spike" | "warning" | "neutral";
  };
};

export type OrchestrationTimelineEvent = {
  id: string;
  time: string;
  label: string;
  kind: "asset" | "campaign" | "lead" | "execution" | "deployment";
  status: OrchestrationRunStatus;
};

export type MarketSignal = {
  id: string;
  label: string;
  value: string;
  change: string;
  direction: "up" | "down" | "neutral";
  detail: string;
  confidence: number;
  source: string;
};

export type AgentPerformance = {
  key: string;
  name: string;
  status: string;
  currentTask: string;
  resultMetric: string;
  lastActivity: string;
  href: string;
  executionCount: number;
  resultRate: number;
  performanceScore: number;
  lastExecutedAt: string;
};

export type AccountConnection = {
  id: string;
  name: string;
  status: ConnectionStatus;
  href: string;
};

export type BusinessGoal = {
  id: string;
  label: string;
  current: number;
  target: number;
  unit: "currency" | "count";
  pacingStatus: GoalPacingStatus;
  pacingLabel: string;
  projectedLabel?: string;
  pacePerDay?: number;
  etaDays?: number | null;
};
