import { ROUTES } from "@/lib/navigation/platform-nav";

export type NavTarget = {
  href: string;
  breadcrumb: string;
  label: string;
};

const NAV_PATTERNS: { pattern: RegExp; target: NavTarget }[] = [
  {
    pattern: /\b(campaign ops|live campaigns?|active campaigns?|campaign workspace|ad ops)\b/i,
    target: { href: ROUTES.campaignOps, breadcrumb: "Campaign Ops → Live campaigns", label: "Campaign Ops" },
  },
  {
    pattern: /\b(approval|approvals|pending approval)\b/i,
    target: { href: ROUTES.approvalCenter, breadcrumb: "Approval Center", label: "Approval Center" },
  },
  {
    pattern: /\b(landing page|funnel studio|edit (my )?landing|offer builder)\b/i,
    target: { href: ROUTES.funnelStudio, breadcrumb: "Funnel Studio → Landing pages", label: "Funnel Studio" },
  },
  {
    pattern: /\b(growth engine|offer builder|engine workspace)\b/i,
    target: { href: ROUTES.growthEngine, breadcrumb: "Growth Engine", label: "Growth Engine" },
  },
  {
    pattern: /\b(leads os|leads?|pipeline|qualification queue|hot leads)\b/i,
    target: { href: ROUTES.leadsOs, breadcrumb: "Leads OS", label: "Leads OS" },
  },
  {
    pattern: /\b(agent|agents)\b/i,
    target: { href: ROUTES.agents, breadcrumb: "Agents", label: "Agents" },
  },
  {
    pattern: /\b(integration|connect meta|connect google|stripe|tracking|pixel)\b/i,
    target: { href: ROUTES.integrationsHub, breadcrumb: "Integrations Hub", label: "Integrations Hub" },
  },
  {
    pattern: /\b(report|revenue|roas|attribution|intelligence)\b/i,
    target: { href: ROUTES.reportsIntelligence, breadcrumb: "Reports & Intelligence", label: "Reports" },
  },
  {
    pattern: /\b(optimization|optimize)\b/i,
    target: { href: ROUTES.optimizationLab, breadcrumb: "Optimization Lab", label: "Optimization Lab" },
  },
  {
    pattern: /\b(automation|follow-?up|workflow)\b/i,
    target: { href: ROUTES.automationCenter, breadcrumb: "Automation Center", label: "Automation Center" },
  },
  {
    pattern: /\b(mission control|dashboard|overview|home)\b/i,
    target: { href: ROUTES.missionControl, breadcrumb: "Growth Command Center", label: "Mission Control" },
  },
  {
    pattern: /\b(organization|settings|workspace)\b/i,
    target: { href: `${ROUTES.organization}?tab=settings`, breadcrumb: "Organization → Workspace", label: "Workspace settings" },
  },
];

export function resolveNavigation(text: string): NavTarget | null {
  const lower = text.toLowerCase();
  if (/\b(take me|open|go to|show me|where (is|do)|navigate)\b/i.test(lower)) {
    for (const { pattern, target } of NAV_PATTERNS) {
      if (pattern.test(lower)) return target;
    }
  }
  for (const { pattern, target } of NAV_PATTERNS) {
    if (pattern.test(lower) && /\b(where|edit|change|find)\b/i.test(lower)) return target;
  }
  return null;
}
