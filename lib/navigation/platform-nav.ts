import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bot,
  Building2,
  Calendar,
  CheckSquare,
  ClipboardList,
  FlaskConical,
  Funnel,
  Inbox,
  LayoutDashboard,
  LineChart,
  Mail,
  Mails,
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
  /** When true, section header is hidden (e.g. Mission Control home). */
  standalone?: boolean;
  items: DashboardNavItem[];
};

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

/** Sidebar: Onboarding (solo) → Mission Control (solo) → Automation → Business setup → Leads → Campaigns → Ops → Follow-up */
export const GROWTH_SIDEBAR_GROUPS: DashboardNavGroup[] = [
  {
    id: "business_onboarding",
    label: "Business onboarding",
    standalone: true,
    items: [
      {
        id: "business_profile",
        href: ROUTES.businessProfile,
        label: "Business profile",
        description: "Brand, offer & company details",
        icon: Building2,
      },
      {
        id: "business_profile" as const,
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
    id: "automation",
    label: "Automation",
    items: [
      {
        id: "automation_center",
        href: ROUTES.automationCenter,
        label: "Automation Center",
        description: "Rules, triggers & orchestration",
        icon: Webhook,
      },
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
    ],
  },
  {
    id: "business",
    label: "Business setup",
    items: [
      {
        id: "integrations_hub",
        href: ROUTES.integrationsHub,
        label: "Integrations",
        description: "Meta & Google ads (more coming soon)",
        icon: Plug,
      },
      {
        id: "agents",
        href: ROUTES.agents,
        label: "AI agents",
        description: "Activate & manage agent stacks",
        icon: Bot,
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
      {
        id: "approval_center",
        href: ROUTES.approvalCenter,
        label: "Lead approvals",
        description: "Review before agents act",
        icon: ShieldAlert,
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
        label: "Campaign manager",
        description: "Meta, Google & paid media",
        icon: Radar,
      },
      {
        id: "growth_engine",
        href: ROUTES.growthEngine,
        label: "Growth engine",
        description: "Research → launch pipeline",
        icon: Sparkles,
      },
      {
        id: "approval_center" as const,
        href: ROUTES.approvalCenter,
        label: "Campaign approvals",
        description: "Draft → live with guardrails",
        icon: ShieldAlert,
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
        description: "Your work & agent tasks",
        icon: CheckSquare,
      },
      {
        id: "inbox",
        href: ROUTES.inbox,
        label: "Team inbox",
        description: "Replies & AI chat",
        icon: MessageSquare,
      },
      {
        id: "analytics",
        href: ROUTES.analytics,
        label: "Analytics",
        description: "Traffic, CVR & performance",
        icon: LineChart,
      },
      {
        id: "optimization_lab",
        href: ROUTES.optimizationLab,
        label: "Optimization lab",
        description: "AI tuning & experiments",
        icon: FlaskConical,
      },
      {
        id: "reports_intelligence",
        href: ROUTES.reportsIntelligence,
        label: "Reports",
        description: "ROAS, pipeline & forecasts",
        icon: BarChart3,
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
    id: "followup",
    label: "Follow-up",
    items: [
      {
        id: "follow_up",
        href: ROUTES.followUp,
        label: "Follow-up hub",
        description: "Email sequences & nurture",
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
];

/** Flat nav list for command palette — mirrors sidebar priority. */
export const DASHBOARD_NAV: DashboardNavItem[] = GROWTH_SIDEBAR_GROUPS.flatMap((g) => g.items);

/** Grouped view for docs / palettes. */
export const DASHBOARD_NAV_GROUPS: DashboardNavGroup[] = GROWTH_SIDEBAR_GROUPS;
