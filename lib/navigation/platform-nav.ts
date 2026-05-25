import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bot,
  Building2,
  FlaskConical,
  Funnel,
  Gauge,
  LayoutDashboard,
  Plug,
  Radar,
  ShieldAlert,
  Sparkles,
  Users,
  Webhook,
} from "lucide-react";

/** Canonical dashboard routes for the AI Growth Operating System. */
export const ROUTES = {
  missionControl: "/dashboard",
  growthEngine: "/dashboard/engine",
  campaignOps: "/dashboard/campaign-ops",
  leadsOs: "/dashboard/leads",
  funnelStudio: "/dashboard/funnel",
  agents: "/dashboard/agents",
  optimizationLab: "/dashboard/optimization",
  integrationsHub: "/dashboard/integrations",
  automationCenter: "/dashboard/automations",
  approvalCenter: "/dashboard/approvals",
  reportsIntelligence: "/dashboard/reports",
  organization: "/dashboard/organization",
  /** Legacy — redirect to campaignOps */
  ads: "/dashboard/ads",
  campaigns: "/dashboard/campaigns",
  team: "/dashboard/team",
  billing: "/dashboard/billing",
  settings: "/dashboard/settings",
} as const;

export type DashboardNavId =
  | "mission_control"
  | "growth_engine"
  | "campaign_ops"
  | "leads_os"
  | "funnel_studio"
  | "agents"
  | "optimization_lab"
  | "integrations_hub"
  | "automation_center"
  | "approval_center"
  | "reports_intelligence"
  | "organization";

export type DashboardNavItem = {
  id: DashboardNavId;
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const DASHBOARD_NAV: DashboardNavItem[] = [
  {
    id: "mission_control",
    href: ROUTES.missionControl,
    label: "Mission Control",
    description: "Global live command center — KPIs, system map, agents, alerts, and opportunities.",
    icon: LayoutDashboard,
  },
  {
    id: "growth_engine",
    href: ROUTES.growthEngine,
    label: "Growth Engine",
    description: "AI business launcher — research through launch with agent stack and run workspaces.",
    icon: Sparkles,
  },
  {
    id: "campaign_ops",
    href: ROUTES.campaignOps,
    label: "Campaign Ops",
    description: "Live paid media operations — platforms, campaigns, budgets, tracking, and agent actions.",
    icon: Radar,
  },
  {
    id: "leads_os",
    href: ROUTES.leadsOs,
    label: "Leads OS",
    description: "Post-capture revenue ops — CRM, pipelines, conversations, follow-up, and attribution.",
    icon: Users,
  },
  {
    id: "funnel_studio",
    href: ROUTES.funnelStudio,
    label: "Funnel Studio",
    description: "Conversion systems — landing pages, forms, variants, and funnel analytics.",
    icon: Funnel,
  },
  {
    id: "agents",
    href: ROUTES.agents,
    label: "Agents",
    description: "Autonomous execution layer — stacks, tasks, reasoning, permissions, and rollback.",
    icon: Bot,
  },
  {
    id: "optimization_lab",
    href: ROUTES.optimizationLab,
    label: "Optimization Lab",
    description: "Continuous AI tuning — budget, creative, funnel, audience, and scaling experiments.",
    icon: FlaskConical,
  },
  {
    id: "integrations_hub",
    href: ROUTES.integrationsHub,
    label: "Integrations Hub",
    description: "OAuth, APIs, webhooks, sync health, and credential vault for external systems.",
    icon: Plug,
  },
  {
    id: "automation_center",
    href: ROUTES.automationCenter,
    label: "Automation Center",
    description: "Workflow orchestration — triggers, multi-step flows, and agent-driven routing.",
    icon: Webhook,
  },
  {
    id: "approval_center",
    href: ROUTES.approvalCenter,
    label: "Approval Center",
    description: "Human oversight — launches, budgets, agent actions, policy, and audit history.",
    icon: ShieldAlert,
  },
  {
    id: "reports_intelligence",
    href: ROUTES.reportsIntelligence,
    label: "Reports & Intelligence",
    description: "Executive analytics — ROAS, pipeline, attribution, forecasts, and AI summaries.",
    icon: BarChart3,
  },
  {
    id: "organization",
    href: ROUTES.organization,
    label: "Organization",
    description: "Workspace admin — team, billing, security, API access, and settings.",
    icon: Building2,
  },
];

/** Agent roles surfaced across Mission Control and Agents module. */
export const PLATFORM_AGENT_ROSTER = [
  { key: "research", label: "Research Agent" },
  { key: "offer", label: "Offer Agent" },
  { key: "funnel", label: "Funnel Agent" },
  { key: "landing", label: "Landing Agent" },
  { key: "ads", label: "Ads Agent" },
  { key: "creative", label: "Creative Agent" },
  { key: "crm", label: "CRM Agent" },
  { key: "follow_up", label: "Follow-Up Agent" },
  { key: "analytics", label: "Analytics Agent" },
  { key: "optimization", label: "Optimization Agent" },
  { key: "retargeting", label: "Retargeting Agent" },
  { key: "compliance", label: "Compliance Agent" },
] as const;

export const PRODUCT_TAGLINE = "AI Growth Operating System";
