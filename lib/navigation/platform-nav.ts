import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bot,
  Building2,
  Calendar,
  CheckSquare,
  ClipboardList,
  Funnel,
  Inbox,
  LayoutDashboard,
  Mails,
  Phone,
  Plug,
  Radar,
  Target,
  Users,
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
  automationPipelines: "/dashboard/automations/pipelines",
  workflows: "/dashboard/workflows",
  aiCallCommandCenter: "/dashboard/ai-calls",
  merchantServices: "/dashboard/merchant-services",
  aiTextCommandCenter: "/dashboard/ai-text",
  emailCampaignCenter: "/dashboard/email-campaigns",
  approvalCenter: "/dashboard/approvals",
  reportsIntelligence: "/dashboard/reports",
  organization: "/dashboard/organization",
  businessProfile: "/dashboard/business",
  onboarding: "/onboarding",
  tasks: "/dashboard/tasks",
  followUp: "/dashboard/follow-up",
  inbox: "/dashboard/inbox",
  calendar: "/dashboard/calendar",
  analytics: "/dashboard/analytics",
  analyticsTraffic: "/dashboard/analytics",
  pipeline: "/dashboard/leads",
  landingPages: "/dashboard/funnel",
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
  standalone?: boolean;
  items: DashboardNavItem[];
};

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

/** User-facing sidebar — streamlined per product IA. */
export const GROWTH_SIDEBAR_GROUPS: DashboardNavGroup[] = [
  {
    id: "business_onboarding",
    label: "Business onboarding",
    standalone: true,
    items: [
      {
        id: "business_profile",
        href: ROUTES.onboarding,
        label: "Onboarding setup",
        description: "Finish setup & connect accounts",
        icon: ClipboardList,
      },
    ],
  },
  {
    id: "mission_control",
    label: "Mission Control",
    standalone: true,
    items: [
      {
        id: "mission_control",
        href: ROUTES.missionControl,
        label: "Mission Control",
        description: "Your growth command center",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: "business",
    label: "Business",
    items: [
      {
        id: "business_profile",
        href: ROUTES.businessProfile,
        label: "Business context",
        description: "Brand, audience, offer & goals",
        icon: Building2,
      },
      {
        id: "agents",
        href: ROUTES.agents,
        label: "AI agents",
        description: "Activate & manage agent stacks",
        icon: Bot,
      },
      {
        id: "organization",
        href: ROUTES.organization,
        label: "Workspace",
        description: "Plan, seats & settings",
        icon: Zap,
      },
    ],
  },
  {
    id: "leads",
    label: "Leads & CRM",
    items: [
      {
        id: "leads_os",
        href: ROUTES.leadsOs,
        label: "Leads inbox",
        description: "New leads & conversations",
        icon: Inbox,
      },
      {
        id: "leads_os" as const,
        href: ROUTES.pipeline,
        label: "Sales pipeline",
        description: "Stages, deals & next steps",
        icon: Users,
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
        label: "Zernio connection",
        description: "Connect paid media via Zernio",
        icon: Plug,
      },
    ],
  },
  {
    id: "automation",
    label: "Automation",
    items: [
      {
        id: "mission_control" as const,
        href: ROUTES.automationPipelines,
        label: "Pipelines",
        description: "Stages & stage automations",
        icon: Target,
      },
      {
        id: "mission_control" as const,
        href: ROUTES.workflows,
        label: "Workflows",
        description: "Visual automation builder",
        icon: Workflow,
      },
      {
        id: "mission_control" as const,
        href: ROUTES.emailCampaignCenter,
        label: "Email campaigns",
        description: "Audiences, templates & sends",
        icon: Mails,
      },
      {
        id: "mission_control" as const,
        href: ROUTES.aiCallCommandCenter,
        label: "AI call center",
        description: "Inbound & outbound AI calling",
        icon: Phone,
      },
      {
        id: "funnel_studio",
        href: ROUTES.funnelStudio,
        label: "Funnel Studio",
        description: "Landing pages, forms & offers",
        icon: Funnel,
      },
      {
        id: "tasks",
        href: ROUTES.tasks,
        label: "Tasks & projects",
        description: "Assign work & move stages",
        icon: CheckSquare,
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
    id: "analytics_group",
    label: "Analytics",
    standalone: true,
    items: [
      {
        id: "analytics",
        href: ROUTES.analyticsTraffic,
        label: "Analytics — Traffic",
        description: "Site traffic & agent activity",
        icon: BarChart3,
      },
    ],
  },
];

export const DASHBOARD_NAV: DashboardNavItem[] = GROWTH_SIDEBAR_GROUPS.flatMap((g) => g.items);
export const DASHBOARD_NAV_GROUPS: DashboardNavGroup[] = GROWTH_SIDEBAR_GROUPS;
