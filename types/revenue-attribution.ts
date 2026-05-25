export type AttributionModel =
  | "first_touch"
  | "last_touch"
  | "multi_touch"
  | "linear"
  | "ai_assisted"
  | "manual_override";

export type RevenueCloseMethod =
  | "crm_won"
  | "stripe"
  | "shopify"
  | "square"
  | "quickbooks"
  | "manual_entry"
  | "csv_import"
  | "webhook"
  | "api";

export type RevenueSourcePlatform =
  | "meta"
  | "google"
  | "youtube"
  | "tiktok"
  | "bing"
  | "linkedin"
  | "organic"
  | "direct"
  | "referral"
  | "email"
  | "sms"
  | "ai_follow_up"
  | "retargeting"
  | "manual"
  | "crm"
  | "stripe"
  | "shopify"
  | "square"
  | "quickbooks"
  | "other";

export type SourceAttributionRow = {
  id: string;
  sourceName: string;
  platform: RevenueSourcePlatform;
  campaign: string | null;
  spend: number;
  visits: number;
  leads: number;
  qualifiedLeads: number;
  appointments: number;
  closedDeals: number;
  revenue: number;
  profit: number;
  cpl: number | null;
  cac: number | null;
  roas: number | null;
  conversionRate: number | null;
  pipelineValue: number;
  attributionModel: AttributionModel;
  isOrganic: boolean;
  aiCost: number;
  labelNote?: string;
};

export type CampaignAttributionRow = {
  id: string;
  campaign: string;
  source: string;
  platform: RevenueSourcePlatform;
  spend: number;
  visits: number;
  leads: number;
  qualified: number;
  appointments: number;
  closedDeals: number;
  revenue: number;
  profit: number;
  cpl: number | null;
  cac: number | null;
  roas: number | null;
  status: string;
  aiHealth: "healthy" | "warning" | "critical" | "idle";
  lastAiAction: string;
};

export type RevenueJourneyStep = {
  label: string;
  count: number;
};

export type RevenueJourney = {
  id: string;
  title: string;
  source: string;
  platform: RevenueSourcePlatform;
  spend: number;
  steps: RevenueJourneyStep[];
  touchpoints: string[];
  aiActions: string[];
  closeMethod: string;
  revenue: number;
  profit: number;
  roas: number | null;
};

export type RevenueTimelineEvent = {
  id: string;
  at: string;
  label: string;
  amount: number;
  source: string;
  leadName: string | null;
  campaign: string | null;
  agent: string | null;
  closeMethod: RevenueCloseMethod;
};

export type AgentRevenueContribution = {
  agentKey: string;
  agentName: string;
  cost: number;
  revenueInfluenced: number;
  recoveredLeads: number;
  dealsAssisted: number;
  closedDeals: number;
  roi: number | null;
  roas: number | null;
  highlight: string;
  actions: string[];
};

export type RevenueSummaryCard = {
  revenueGenerated: number;
  closedDeals: number;
  topSourcesLabel: string;
  trackedViaLabel: string;
  profit: number;
  totalSpend: number;
  blendedRoas: number | null;
  pipelineValue: number;
  attributionModel: AttributionModel;
  attributionModelLabel: string;
};

export type RevenueRecommendation = {
  id: string;
  title: string;
  detail: string;
  priority: "high" | "medium" | "low";
};

export type RevenueAttributionSnapshot = {
  summary: RevenueSummaryCard;
  bySource: SourceAttributionRow[];
  campaigns: CampaignAttributionRow[];
  journeys: RevenueJourney[];
  timeline: RevenueTimelineEvent[];
  agentContributions: AgentRevenueContribution[];
  recommendations: RevenueRecommendation[];
  totals: {
    revenue: number;
    spend: number;
    profit: number;
    roas: number | null;
    leads: number;
    closedDeals: number;
    pipelineValue: number;
  };
};
