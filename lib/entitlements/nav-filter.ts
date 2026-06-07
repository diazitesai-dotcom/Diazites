import { CreditCard, Settings } from "lucide-react";

import { filterNavGroupsByAccess } from "@/lib/access-control/nav-filter";
import { ROUTES, type DashboardNavGroup, type DashboardNavItem } from "@/lib/navigation/platform-nav";
import type { PlatformServiceKey } from "@/types/access-control";
import type { EntitlementPlanKey } from "@/types/entitlements";

export type NavItemWithLock = DashboardNavItem & {
  locked?: boolean;
  upgradePlan?: "growth" | "pro";
  lockReason?: string;
};

export type DashboardNavGroupWithLock = Omit<DashboardNavGroup, "items"> & {
  items: NavItemWithLock[];
};

const STARTER_VISIBLE_PATHS = new Set<string>([
  ROUTES.missionControl,
  ROUTES.leadsOs,
  ROUTES.pipeline,
  ROUTES.funnelStudio,
  ROUTES.campaignOps,
  ROUTES.agents,
  ROUTES.aiCallCommandCenter,
  ROUTES.workflows,
  ROUTES.automationPipelines,
  ROUTES.emailCampaignCenter,
  ROUTES.merchantServices,
  ROUTES.analyticsTraffic,
  ROUTES.calendar,
  ROUTES.businessProfile,
  ROUTES.onboarding,
  ROUTES.tasks,
  ROUTES.organization,
]);

function pathOf(href: string): string {
  return href.split("?")[0] ?? href;
}

function isStarterPlan(plan: EntitlementPlanKey): boolean {
  return plan === "starter" || plan === "trial";
}

export function filterNavGroupsByPlan(
  groups: DashboardNavGroup[],
  enabledServiceKeys: PlatformServiceKey[],
  isOwnerAdmin: boolean,
  planKey: EntitlementPlanKey,
): DashboardNavGroupWithLock[] {
  if (isOwnerAdmin) {
    return groups.map((g) => ({ ...g, items: g.items.map((i) => ({ ...i })) }));
  }

  const serviceFiltered = filterNavGroupsByAccess(groups, enabledServiceKeys, false);

  if (!isStarterPlan(planKey)) {
    return serviceFiltered.map((g) => ({ ...g, items: g.items.map((i) => ({ ...i })) }));
  }

  const result: DashboardNavGroupWithLock[] = [];

  for (const group of serviceFiltered) {
    const items: NavItemWithLock[] = [];

    for (const item of group.items) {
      const p = pathOf(item.href);
      if (STARTER_VISIBLE_PATHS.has(p)) {
        items.push({ ...item });
      }
    }

    if (items.length > 0) {
      result.push({ ...group, items });
    }
  }

  result.push({
    id: "settings_billing",
    label: "Settings",
    items: [
      {
        id: "organization",
        href: "/dashboard/settings",
        label: "Settings",
        description: "Profile, agents, ads, voice & integrations",
        icon: Settings,
      },
      {
        id: "organization",
        href: `${ROUTES.organization}?tab=billing`,
        label: "Billing / Upgrade",
        description: "Plan, usage & upgrade",
        icon: CreditCard,
      },
    ],
  });

  return result;
}
