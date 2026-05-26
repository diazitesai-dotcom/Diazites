import type { DeploymentLaunchParams } from "@/types/agent-deployment";

export type OperatorMode =
  | "answer"
  | "navigation"
  | "action"
  | "diagnostic"
  | "support"
  | "operator";

export type OperatorActionKind =
  | "navigate"
  | "deploy"
  | "fix"
  | "open_diagnostics"
  | "approve"
  | "review_logs";

export type OperatorAction = {
  id: string;
  label: string;
  kind: OperatorActionKind;
  href?: string;
  deploy?: DeploymentLaunchParams;
  requiresApproval?: boolean;
};

export type OperatorPlatformContext = {
  hasBusiness: boolean;
  businessName?: string;
  pagePath: string;
  healthScore: number;
  riskLevel: "low" | "medium" | "high";
  revenue: number;
  pipeline: number;
  spend: number;
  roas: number | null;
  leadVelocity7d: number;
  totalLeads: number;
  activeCampaigns: number;
  activeAgents: number;
  totalAgents: number;
  pendingApprovals: number;
  connectedPlatforms: string[];
  trackingStatus: "healthy" | "degraded" | "unknown";
  crmConnected: boolean;
  metaConnected: boolean;
  googleConnected: boolean;
  agentIssues: string[];
  topInsight?: string;
};

export type OperatorAssistantMessage = {
  id: string;
  role: "assistant";
  mode: OperatorMode;
  content: string;
  bullets?: string[];
  breadcrumb?: string;
  actions?: OperatorAction[];
  logLine?: string;
};

export type OperatorUserMessage = {
  id: string;
  role: "user";
  content: string;
};

export type OperatorMessage = OperatorUserMessage | OperatorAssistantMessage;

export type OperatorPreset = {
  id: string;
  label: string;
  description: string;
  prompt: string;
};

export type ProcessOperatorInput = {
  message: string;
  pathname: string;
};
