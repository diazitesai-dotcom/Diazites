import type { AgentType } from "@/types/domain";

export type AgentWorkspaceTabId = string;

export type AgentWorkspaceTab = {
  id: AgentWorkspaceTabId;
  label: string;
};

export type AgentWorkspaceQueueItem = {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  status: "running" | "queued" | "blocked";
  eta?: string;
};

export type AgentWorkspaceLogEntry = {
  id: string;
  at: string;
  level: "info" | "warn" | "error";
  message: string;
};

export type AgentWorkspaceReasoningStep = {
  id: string;
  at: string;
  summary: string;
  detail: string;
  confidence?: number;
};

export type AgentWorkspacePlatform = {
  id: string;
  name: string;
  status: "connected" | "disconnected" | "needs_attention";
  detail: string;
};

export type AgentWorkspaceCampaign = {
  id: string;
  name: string;
  platform: string;
  role: "owner" | "optimizer" | "monitor";
  spend?: string;
  status: string;
};

export type AgentWorkspaceTask = {
  id: string;
  label: string;
  status: "in_progress" | "scheduled" | "done";
  due?: string;
};

export type AgentWorkspaceMemoryEntry = {
  id: string;
  label: string;
  value: string;
  updatedAt: string;
};

export type AgentWorkspaceApproval = {
  id: string;
  title: string;
  state: "pending" | "approved" | "rejected";
  requestedAt: string;
};

export type AgentWorkspaceScoringRule = {
  id: string;
  label: string;
  weight: string;
  description: string;
};

export type AgentWorkspaceLeadRow = {
  id: string;
  name: string;
  score: number;
  bucket: string;
  status: string;
  rationale: string;
  source: string;
};

export type AgentWorkspaceData = {
  agentKey: AgentType;
  agentName: string;
  workspaceTitle: string;
  status: string;
  activatedAt: string | null;
  description: string;
  tabs: AgentWorkspaceTab[];
  queue: AgentWorkspaceQueueItem[];
  logs: AgentWorkspaceLogEntry[];
  reasoning: AgentWorkspaceReasoningStep[];
  platforms: AgentWorkspacePlatform[];
  campaigns: AgentWorkspaceCampaign[];
  tasks: AgentWorkspaceTask[];
  memory: AgentWorkspaceMemoryEntry[];
  performance: {
    score: number;
    executions: number;
    successRate: number;
    resultLabel: string;
  };
  permissions: { id: string; label: string; enabled: boolean; scope: string }[];
  approvals: AgentWorkspaceApproval[];
  scoringRules: AgentWorkspaceScoringRule[];
  qualifiedLeads: AgentWorkspaceLeadRow[];
  rejectedLeads: AgentWorkspaceLeadRow[];
};
