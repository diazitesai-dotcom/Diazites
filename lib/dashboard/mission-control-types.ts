import type { OrchestrationRunStatus } from "@/lib/dashboard/orchestration-status";

export type { OrchestrationFlowStep, OrchestrationFlowStatus } from "@/lib/dashboard/build-orchestration-flow";

export type ConnectionStatus =
  | "connected"
  | "pending"
  | "missing"
  | "error"
  | "expired"
  | "needs_attention";

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
  trafficSignal?: {
    headline: string;
    source: string;
  };
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

export type PlanRisk = "low" | "medium" | "high";

export type PlanIntelligence = {
  confidence: number;
  risk: PlanRisk;
  deployEtaSeconds: number;
};

export type BusinessOutcomeProjection = {
  leadsPerMonth: string;
  pipelineValue: string;
};

export type ApprovalState = "pending" | "ai_approved" | "user_approval_required";

export type RecommendedNextAction = {
  title: string;
  impact: string;
  href: string;
  cta: string;
  businessOutcome: BusinessOutcomeProjection;
  approvalState: ApprovalState;
} & PlanIntelligence;

export type PlanLifecycleStatus =
  | "draft"
  | "reviewing"
  | "approved"
  | "deploying"
  | "live"
  | "optimizing"
  | "paused"
  | "failed"
  | "rolled_back";

export type StackHealthStatus = "healthy" | "warning" | "degraded" | "active";

export type StackHealthItem = {
  id: string;
  label: string;
  status: StackHealthStatus;
};

export type AutonomousPolicy = {
  spendCap: string;
  approvalRequired: boolean;
  optimizationMode: "auto-approved" | "manual" | "guided";
  rollbackEnabled: boolean;
  budgetApprovalThreshold: string;
  autoPauseOnCplSpike: boolean;
  rollbackThreshold: string;
  businessHoursMode: boolean;
};

export type RevenueCommandCenter = {
  spend: number;
  leads: number;
  cpl: number | null;
  roas: number | null;
  revenue: number;
  pipeline: number;
  appointments: number;
  closedDeals: number;
};

export type TimelineActionId =
  | "retry"
  | "open_logs"
  | "agent_reasoning"
  | "view_payload"
  | "rollback"
  | "ai_fix";

export type TimelineAction = {
  id: TimelineActionId;
  label: string;
};

export type LandingStackVersion = {
  id: string;
  name: string;
  status: "live" | "draft" | "archived";
  headline: string;
  conversions?: string;
  lastUpdated: string;
};

export type OrchestrationTimelineDetail = {
  label: string;
  value: string;
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
  reasoning?: string;
  expectedOutcome?: string;
} & PlanIntelligence;

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
} & PlanIntelligence;

export type GoalPacingStatus = "ahead" | "on_track" | "behind";

export type GoalCoaching = {
  blocker: string;
  suggestedMove: string;
};

export type SparkAnnotation = {
  kind: "spike" | "warning" | "neutral";
  label?: string;
  title: string;
  detail?: string;
  source?: string;
  predictions?: string[];
};

export type SparkPoint = {
  d: string;
  v: number;
  annotation?: SparkAnnotation;
};

export type OrchestrationTimelineEvent = {
  id: string;
  time: string;
  label: string;
  kind: "asset" | "campaign" | "lead" | "execution" | "deployment";
  status: OrchestrationRunStatus;
  durationSeconds?: number;
  system?: string;
  rollbackStatus?: "available" | "unavailable" | "used";
  details?: OrchestrationTimelineDetail[];
  failureReason?: string;
  aiReasoning?: string;
  actions?: TimelineAction[];
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
  queueDepth: number;
  memoryLabel: string;
  taskCount: number;
};

export type AccountConnection = {
  id: string;
  name: string;
  status: ConnectionStatus;
  href: string;
  healthDetail?: string;
  category?: "ads" | "crm" | "commerce" | "comms" | "analytics" | "ai";
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
