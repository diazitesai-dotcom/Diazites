export type PipelineStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "booked"
  | "won"
  | "lost";

export type AgentType =
  | "social_ads"
  | "search_ads"
  | "landing_page"
  | "ai_follow_up"
  | "retargeting"
  | "lead_qualification";

export interface MetricCard {
  label: string;
  value: string;
  delta?: string;
}
