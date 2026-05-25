import { AGENTS } from "@/utils/constants";
import type { AgentType } from "@/types/domain";
import type { AgentWorkspaceTab } from "@/types/agent-workspace";

export function agentWorkspacePath(agentKey: AgentType): string {
  return `/dashboard/agents/${agentKey}`;
}

export function isDeployableAgentKey(key: string): key is AgentType {
  return AGENTS.some((a) => a.key === key);
}

/** Maps aspirational platform roster keys to deployable agent workspaces. */
export const ROSTER_TO_DEPLOYABLE_AGENT: Partial<Record<string, AgentType>> = {
  ads: "search_ads",
  landing: "landing_page",
  crm: "lead_qualification",
  follow_up: "ai_follow_up",
  retargeting: "retargeting",
};

type WorkspaceProfile = {
  workspaceTitle: string;
  tabs: AgentWorkspaceTab[];
};

const OPS_TABS: AgentWorkspaceTab[] = [
  { id: "overview", label: "Overview" },
  { id: "queue", label: "Queue" },
  { id: "logs", label: "Logs" },
  { id: "reasoning", label: "AI reasoning" },
  { id: "platforms", label: "Platforms" },
  { id: "campaigns", label: "Campaign ownership" },
  { id: "tasks", label: "Current tasks" },
  { id: "memory", label: "Memory" },
  { id: "performance", label: "Performance" },
  { id: "permissions", label: "Permissions" },
  { id: "approvals", label: "Approvals" },
];

const QUALIFICATION_TABS: AgentWorkspaceTab[] = [
  { id: "overview", label: "Overview" },
  { id: "rules", label: "Rules" },
  { id: "scoring", label: "Scoring engine" },
  { id: "qualified", label: "Qualified leads" },
  { id: "rejected", label: "Rejected leads" },
  { id: "reasoning", label: "AI rationale" },
  { id: "override", label: "Manual override" },
];

const WORKSPACE_PROFILES: Record<AgentType, WorkspaceProfile> = {
  search_ads: {
    workspaceTitle: "Search Ads Agent Workspace",
    tabs: OPS_TABS,
  },
  social_ads: {
    workspaceTitle: "Social Ads Agent Workspace",
    tabs: OPS_TABS,
  },
  lead_qualification: {
    workspaceTitle: "Qualification Workspace",
    tabs: QUALIFICATION_TABS,
  },
  landing_page: {
    workspaceTitle: "Landing Page Agent Workspace",
    tabs: OPS_TABS.filter(
      (t) => !["platforms", "campaigns"].includes(t.id),
    ).concat([{ id: "platforms", label: "Publish targets" }]),
  },
  ai_follow_up: {
    workspaceTitle: "Follow-Up Agent Workspace",
    tabs: [
      { id: "overview", label: "Overview" },
      { id: "queue", label: "Queue" },
      { id: "logs", label: "Logs" },
      { id: "reasoning", label: "AI reasoning" },
      { id: "tasks", label: "Current tasks" },
      { id: "memory", label: "Memory" },
      { id: "performance", label: "Performance" },
      { id: "permissions", label: "Permissions" },
      { id: "approvals", label: "Approvals" },
    ],
  },
  retargeting: {
    workspaceTitle: "Retargeting Agent Workspace",
    tabs: OPS_TABS.filter((t) => t.id !== "campaigns").concat([
      { id: "campaigns", label: "Audience ownership" },
    ]),
  },
};

export function getAgentWorkspaceProfile(agentKey: AgentType): WorkspaceProfile {
  return WORKSPACE_PROFILES[agentKey];
}
