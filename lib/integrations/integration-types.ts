import type { ConnectionStatus } from "@/lib/dashboard/mission-control-types";

export type IntegrationCategoryId =
  | "paid_ads"
  | "video_streaming"
  | "ecommerce_retail"
  | "native"
  | "programmatic"
  | "local_smb"
  | "crm"
  | "email_sms"
  | "analytics"
  | "ecommerce_payments";

export type AgentPermissionLevel =
  | "read_only"
  | "recommend_only"
  | "requires_approval"
  | "auto_execute"
  | "full_autonomous";

export type IntegrationAgentType =
  | "paid_ads"
  | "google_youtube"
  | "tiktok"
  | "linkedin"
  | "crm"
  | "email_sms"
  | "analytics"
  | "ecommerce";

export type GrowthIntegration = {
  id: string;
  name: string;
  categoryId: IntegrationCategoryId;
  subchannels?: string[];
  agentType: IntegrationAgentType;
  status: ConnectionStatus;
  agentPermissions: AgentPermissionLevel;
  lastSync: string | null;
  dataAccess: string;
  connectedCampaigns?: number;
};

export type IntegrationCategory = {
  id: IntegrationCategoryId;
  label: string;
  description: string;
};

export type AgentCapabilityGroup = {
  agentType: IntegrationAgentType;
  label: string;
  capabilities: string[];
};

export type BudgetSafetyControls = {
  dailySpendCap: string;
  campaignSpendCap: string;
  approvalThreshold: string;
  autoPauseCplSpike: boolean;
  autoPauseRoasDrop: boolean;
  alertFailedTracking: boolean;
  alertDisconnectedAccount: boolean;
};
