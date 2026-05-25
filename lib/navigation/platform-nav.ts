import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bot,
  Building2,
  FlaskConical,
  Funnel,
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

export type DashboardNavGroup = {
  id: string;
  label: string;
  items: DashboardNavItem[];
};

/** Sidebar groups — operational flow of the Growth OS. */
export const DASHBOARD_NAV_GROUPS: DashboardNavGroup[] = [
  {
    id: "operate",
    label: "Operate",
    items: [
      {
        id: "mission_control",
        href: ROUTES.missionControl,
        label: "Mission Control",
        description: "Global live command center",
        icon: LayoutDashboard,
      },
      {
        id: "campaign_ops",
        href: ROUTES.campaignOps,
        label: "Campaign Ops",
        description: "Live paid media & platforms",
        icon: Radar,
      },
      {
        id: "leads_os",
        href: ROUTES.leadsOs,
        label: "Leads OS",
        description: "CRM, pipeline & follow-up",
        icon: Users,
      },
    ],
  },
  {
    id: "build",
    label: "Build",
    items: [
      {
        id: "growth_engine",
        href: ROUTES.growthEngine,
        label: "Growth Engine",
        description: "Research → launch pipeline",
        icon: Sparkles,
      },
      {
        id: "funnel_studio",
        href: ROUTES.funnelStudio,
        label: "Funnel Studio",
        description: "Pages, forms & conversion",
        icon: Funnel,
      },
    ],
  },
  {
    id: "autonomous",
    label: "Autonomous",
    items: [
      {
        id: "agents",
        href: ROUTES.agents,
        label: "Agents",
        description: "Execution, tasks & rollback",
        icon: Bot,
      },
      {
        id: "optimization_lab",
        href: ROUTES.optimizationLab,
        label: "Optimization Lab",
        description: "Continuous AI tuning",
        icon: FlaskConical,
      },
    ],
  },
  {
    id: "connect",
    label: "Connect",
    items: [
      {
        id: "integrations_hub",
        href: ROUTES.integrationsHub,
        label: "Integrations Hub",
        description: "OAuth, APIs & sync",
        icon: Plug,
      },
      {
        id: "automation_center",
        href: ROUTES.automationCenter,
        label: "Automation Center",
        description: "Workflows & triggers",
        icon: Webhook,
      },
      {
        id: "approval_center",
        href: ROUTES.approvalCenter,
        label: "Approval Center",
        description: "Oversight & policy",
        icon: ShieldAlert,
      },
    ],
  },
  {
    id: "admin",
    label: "Intelligence",
    items: [
      {
        id: "reports_intelligence",
        href: ROUTES.reportsIntelligence,
        label: "Reports & Intelligence",
        description: "ROAS, pipeline & forecasts",
        icon: BarChart3,
      },
      {
        id: "organization",
        href: ROUTES.organization,
        label: "Organization",
        description: "Team, billing & security",
        icon: Building2,
      },
    ],
  },
];

/** Flat list (legacy consumers). */
export const DASHBOARD_NAV: DashboardNavItem[] = DASHBOARD_NAV_GROUPS.flatMap((g) => g.items);

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
