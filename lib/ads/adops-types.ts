import type { ZernioAccount } from "@/lib/zernio";
import type { AdAccountRow, AdCampaignRow, AdPlatform } from "@/repositories/ad-account.repository";

export type AdopsPlatformId =
  | "meta"
  | "google"
  | "youtube"
  | "tiktok"
  | "microsoft"
  | "linkedin"
  | "x"
  | "pinterest"
  | "snapchat"
  | "reddit"
  | "amazon"
  | "spotify"
  | "hulu"
  | "taboola"
  | "outbrain"
  | "yelp"
  | "nextdoor";

export type PlatformHealth =
  | "healthy"
  | "sync_delayed"
  | "token_expiring"
  | "oauth_failed"
  | "permission_issue"
  | "api_error"
  | "needs_attention"
  | "disconnected"
  | "failed_tracking";

export type CampaignDisplayStatus =
  | "live"
  | "running"
  | "paused"
  | "failed"
  | "processing"
  | "requires_approval"
  | "degraded"
  | "failed_tracking";

export type AgentAutonomyMode =
  | "read_only"
  | "recommend_only"
  | "requires_approval"
  | "auto_execute"
  | "full_autonomous";

export type AdopsPlatformDef = {
  id: AdopsPlatformId;
  label: string;
  description: string;
  accent: string;
  connectable: boolean;
  mapsToRepo?: AdPlatform;
};

export type AdAccountView = {
  id: string;
  businessName: string;
  accountName: string;
  accountId: string;
  status: string;
  spendToday: number;
  currency: string;
  platformId: AdopsPlatformId;
};

export type PlatformWorkspaceData = {
  platformId: AdopsPlatformId;
  label: string;
  connectionStatus: string;
  health: PlatformHealth;
  lastSync: string | null;
  oauthHealth: string;
  totalSpend: number;
  leads: number;
  roas: number | null;
  campaignCount: number;
  activeAccounts: number;
  pixelConnected: boolean;
  eventLossPercent: number | null;
  accounts: AdAccountView[];
  campaigns: LiveCampaignRow[];
  audiences: { name: string; size: string; type: string }[];
  creatives: { name: string; type: string; performance: string }[];
  agentFeed: AgentActionRow[];
};

export type LiveCampaignRow = {
  id: string;
  name: string;
  platformId: AdopsPlatformId;
  platformLabel: string;
  status: CampaignDisplayStatus;
  spend: number;
  leads: number;
  cpl: number | null;
  ctr: number;
  conversionRate: number;
  roas: number | null;
  budget: number;
  objective: string;
  lastAiAction: string;
  aiHealth: PlatformHealth;
};

export type AgentActionRow = {
  id: string;
  timestamp: string;
  message: string;
  confidence: number;
  riskScore: "low" | "medium" | "high";
  platformId: AdopsPlatformId;
  agentKey: string;
  rollbackAvailable: boolean;
};

export type AdopsAgentKey =
  | "ads"
  | "optimization"
  | "retargeting"
  | "creative"
  | "analytics"
  | "compliance"
  | "crm"
  | "tracking";

export type AdopsAgentView = {
  key: AdopsAgentKey;
  label: string;
  status: "idle" | "running" | "paused" | "error";
  currentTask: string;
  stage: string;
  confidence: number;
  risk: "low" | "medium" | "high";
  connectedPlatforms: AdopsPlatformId[];
  runtime: string;
  eta: string | null;
  tasks: string[];
  reasoning: string;
  actionsTimeline: { time: string; action: string; result: string; risk: string; rollback: boolean }[];
};

export type ExecutionSafetyPolicy = {
  dailySpendCap: number;
  campaignSpendCap: number;
  maxCpl: number;
  minRoas: number;
  approvalThresholdUsd: number;
  pauseOnTrackingFailure: boolean;
  alertOnDisconnect: boolean;
  rollbackEnabled: boolean;
};

export type AdopsPagePayload = {
  businessName: string;
  platforms: AdopsPlatformDef[];
  platformHealth: Record<AdopsPlatformId, PlatformHealth>;
  accountStatus: Record<AdopsPlatformId, AdAccountRow["status"] | "disconnected">;
  liveCampaigns: LiveCampaignRow[];
  agents: AdopsAgentView[];
  globalFeed: AgentActionRow[];
  rollup: { connected: number; activeCampaigns: number; totalSpend: number; cpl: number | null };
  alerts: { id: string; message: string; tone: "amber" | "rose" | "cyan" | "violet"; href: string }[];
  hasWinningAd: boolean;
  winningAdMeta: { runId: string; assetId: string; defaultName: string } | null;
  policy: ExecutionSafetyPolicy;
  rawAccounts: AdAccountRow[];
  rawCampaigns: AdCampaignRow[];
  zernioAccounts: ZernioAccount[];
  zernioLinkedPlatforms: AdopsPlatformId[];
};

export type CampaignWorkspaceTab =
  | "overview"
  | "performance"
  | "creatives"
  | "audiences"
  | "tracking"
  | "optimization"
  | "reasoning"
  | "logs"
  | "approvals";

export const CAMPAIGN_WORKSPACE_TABS: { id: CampaignWorkspaceTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "performance", label: "Performance" },
  { id: "creatives", label: "Creatives" },
  { id: "audiences", label: "Audiences" },
  { id: "tracking", label: "Tracking" },
  { id: "optimization", label: "Optimization" },
  { id: "reasoning", label: "AI Reasoning" },
  { id: "logs", label: "Logs" },
  { id: "approvals", label: "Approvals" },
];
