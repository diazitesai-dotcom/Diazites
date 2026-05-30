import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bot,
  Building2,
  Calendar,
  CheckSquare,
  FlaskConical,
  Funnel,
  Inbox,
  LayoutDashboard,
  LineChart,
  Mail,
  MessageSquare,
  Plug,
  Radar,
  ShieldAlert,
  Sparkles,
  Target,
  Users,
  Webhook,
  Phone,
  Workflow,
  Zap,
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
  workflows: "/dashboard/workflows",
  aiCallCommandCenter: "/dashboard/ai-calls",
  approvalCenter: "/dashboard/approvals",
  reportsIntelligence: "/dashboard/reports",
  organization: "/dashboard/organization",
  businessProfile: "/dashboard/business",
  tasks: "/dashboard/tasks",
  followUp: "/dashboard/follow-up",
  inbox: "/dashboard/inbox",
  calendar: "/dashboard/calendar",
  analytics: "/dashboard/analytics",
  pipeline: "/dashboard/leads",
  landingPages: "/dashboard/funnel",
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
  | "organization"
  | "business_profile"
  | "tasks"
  | "follow_up"
  | "inbox"
  | "calendar"
  | "analytics";

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

/** Primary sidebar order — matches Growth OS operational flow. */
export const DASHBOARD_NAV: DashboardNavItem[] = [
  {
    id: "mission_control",
    href: ROUTES.missionControl,
    label: "Mission Control",
    description: "Growth Command Center",
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
    description:
      "Build websites, funnels, landing pages, forms, offers, surveys, automations, and conversion systems.",
    icon: Funnel,
  },
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
];

/** Optional grouped view for docs / palettes. */
export const DASHBOARD_NAV_GROUPS: DashboardNavGroup[] = [
  { id: "operate", label: "Operate", items: DASHBOARD_NAV.slice(0, 3) },
  { id: "build", label: "Build", items: DASHBOARD_NAV.slice(3, 5) },
  { id: "autonomous", label: "Autonomous", items: DASHBOARD_NAV.slice(5, 7) },
  { id: "connect", label: "Connect", items: DASHBOARD_NAV.slice(7, 10) },
  { id: "admin", label: "Intelligence", items: DASHBOARD_NAV.slice(10, 12) },
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

/** Full spec sidebar — grouped sections mapped to live or Phase 1 routes. */
export const GROWTH_SIDEBAR_GROUPS: DashboardNavGroup[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    items: [
      {
        id: "mission_control",
        href: ROUTES.missionControl,
        label: "Mission Control",
        description: "Growth Command Center",
        icon: LayoutDashboard,
      },
      {
        id: "agents",
        href: ROUTES.agents,
        label: "Live agent activity",
        description: "Status & workspaces",
        icon: Bot,
      },
      {
        id: "reports_intelligence",
        href: ROUTES.reportsIntelligence,
        label: "Performance snapshot",
        description: "ROAS, spend, revenue",
        icon: BarChart3,
      },
      {
        id: "leads_os",
        href: ROUTES.leadsOs,
        label: "Recent leads",
        description: "Inbox & pipeline",
        icon: Users,
      },
      {
        id: "tasks" as const,
        href: ROUTES.tasks,
        label: "Recent tasks",
        description: "Pending & overdue",
        icon: CheckSquare,
      },
      {
        id: "campaign_ops",
        href: ROUTES.campaignOps,
        label: "Campaign alerts",
        description: "Draft & active ads",
        icon: Radar,
      },
    ],
  },
  {
    id: "business",
    label: "Business setup",
    items: [
      {
        id: "business_profile",
        href: ROUTES.businessProfile,
        label: "Business profile",
        description: "Onboarding fields",
        icon: Building2,
      },
      {
        id: "funnel_studio",
        href: ROUTES.funnelStudio,
        label: "Funnel Studio",
        description:
          "Build websites, funnels, landing pages, forms, offers, surveys, automations, and conversion systems.",
        icon: Funnel,
      },
      {
        id: "integrations_hub",
        href: ROUTES.integrationsHub,
        label: "Integrations",
        description: "Ads, CRM, comms",
        icon: Plug,
      },
    ],
  },
  {
    id: "agents",
    label: "AI agents",
    items: [
      {
        id: "agents",
        href: ROUTES.agents,
        label: "Agent marketplace",
        description: "Activate stacks",
        icon: Bot,
      },
      {
        id: "approval_center",
        href: ROUTES.approvalCenter,
        label: "Permissions & approvals",
        description: "Safety modes",
        icon: ShieldAlert,
      },
      {
        id: "automation_center",
        href: ROUTES.automationCenter,
        label: "Agent logs",
        description: "Action history",
        icon: Webhook,
      },
    ],
  },
  {
    id: "campaigns",
    label: "Campaigns",
    items: [
      {
        id: "campaign_ops",
        href: ROUTES.campaignOps,
        label: "All campaigns",
        description: "Google, Meta & more",
        icon: Radar,
      },
      {
        id: "approval_center",
        href: ROUTES.approvalCenter,
        label: "Campaign approvals",
        description: "Draft → live",
        icon: ShieldAlert,
      },
    ],
  },
  {
    id: "leads",
    label: "Leads CRM",
    items: [
      {
        id: "leads_os",
        href: ROUTES.leadsOs,
        label: "Lead inbox",
        description: "Pipeline & hot leads",
        icon: Users,
      },
      {
        id: "leads_os",
        href: `${ROUTES.leadsOs}?view=pipeline`,
        label: "Pipeline",
        description: "Kanban stages",
        icon: Target,
      },
    ],
  },
  {
    id: "automation",
    label: "Automation",
    items: [
      {
        id: "mission_control" as const,
        href: ROUTES.workflows,
        label: "Workflows",
        description: "Visual automations & pipelines",
        icon: Workflow,
      },
      {
        id: "mission_control" as const,
        href: ROUTES.aiCallCommandCenter,
        label: "AI Call Command Center",
        description: "Native AI calling & campaigns",
        icon: Phone,
      },
    ],
  },
  {
    id: "followup",
    label: "Follow-up",
    items: [
      {
        id: "follow_up",
        href: ROUTES.followUp,
        label: "SMS & email",
        description: "Sequences & rules",
        icon: MessageSquare,
      },
      {
        id: "calendar",
        href: ROUTES.calendar,
        label: "Appointments",
        description: "Booking & calendar",
        icon: Calendar,
      },
    ],
  },
  {
    id: "ops",
    label: "Operations",
    items: [
      {
        id: "tasks",
        href: ROUTES.tasks,
        label: "Tasks",
        description: "User & agent tasks",
        icon: CheckSquare,
      },
      {
        id: "inbox",
        href: ROUTES.inbox,
        label: "Inbox",
        description: "Replies & AI chat",
        icon: Inbox,
      },
      {
        id: "analytics",
        href: ROUTES.analytics,
        label: "Analytics",
        description: "Traffic & CVR",
        icon: LineChart,
      },
      {
        id: "optimization_lab",
        href: ROUTES.optimizationLab,
        label: "Optimization",
        description: "AI recommendations",
        icon: FlaskConical,
      },
      {
        id: "reports_intelligence",
        href: ROUTES.reportsIntelligence,
        label: "Reports",
        description: "PDF & email",
        icon: Mail,
      },
      {
        id: "growth_engine",
        href: ROUTES.growthEngine,
        label: "Growth engine",
        description: "Strategy → launch",
        icon: Sparkles,
      },
      {
        id: "organization",
        href: ROUTES.organization,
        label: "Billing & settings",
        description: "Plan & team",
        icon: Zap,
      },
    ],
  },
];
