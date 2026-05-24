export type ConnectionStatus = "connected" | "pending" | "missing" | "error";

export type ActivitySeverity = "success" | "warning" | "critical" | "info";

export type MissionControlBriefing = {
  leadsCaptured: number;
  campaignStatus: string;
  agentStatus: string;
  missedOpportunity: string;
  recommendedNextAction: string;
};

export type RecommendedNextAction = {
  title: string;
  impact: string;
  href: string;
  cta: string;
};

export type HealthCheck = {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
};

export type RevenueForecast = {
  today: number;
  sevenDay: number;
  thirtyDay: number;
  pipelineValue: number;
};

export type FunnelStage = {
  key: string;
  label: string;
  count: number;
  conversionRate: number | null;
  isBottleneck: boolean;
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

export type OpportunityItem = {
  id: string;
  title: string;
  detail: string;
  impact: string;
  priority: "high" | "medium" | "low";
  cta: string;
  href: string;
};

export type MarketSignal = {
  id: string;
  label: string;
  value: string;
  change: string;
  direction: "up" | "down" | "neutral";
  detail: string;
};

export type AgentPerformance = {
  key: string;
  name: string;
  status: string;
  currentTask: string;
  resultMetric: string;
  lastActivity: string;
  href: string;
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
};
