export const HOMEPAGE_TOOL_STORAGE_KEY = "diazites:homepage-tools";

export const HOMEPAGE_TOOL_OPTIONS = [
  {
    id: "leads",
    label: "Leads",
    description: "See new leads and manage your CRM.",
    href: "/dashboard/leads",
  },
  {
    id: "analytics",
    label: "Analytics",
    description: "Check revenue, reports, and business performance.",
    href: "/dashboard/analytics",
  },
  {
    id: "ai_agents",
    label: "AI Agents",
    description: "Manage the agents working for your business.",
    href: "/dashboard/agents",
  },
  {
    id: "business_profile",
    label: "Business Profile",
    description: "Update your business details, offer, and goals.",
    href: "/dashboard/business",
  },
  {
    id: "conversations",
    label: "Conversations",
    description: "Read and reply to customer messages.",
    href: "/dashboard/inbox",
  },
  {
    id: "landing_page",
    label: "Landing Page",
    description: "Edit funnels, pages, forms, and offers.",
    href: "/dashboard/funnel",
  },
] as const;

export type HomepageToolId = (typeof HOMEPAGE_TOOL_OPTIONS)[number]["id"];

export const DEFAULT_HOMEPAGE_TOOL_IDS = HOMEPAGE_TOOL_OPTIONS.map((tool) => tool.id);

export function isHomepageToolId(value: string): value is HomepageToolId {
  return HOMEPAGE_TOOL_OPTIONS.some((tool) => tool.id === value);
}
