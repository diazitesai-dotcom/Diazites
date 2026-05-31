import type { PlatformServiceKey } from "@/types/access-control";

/** Default free-tier services for new signups (must match migration seed). */
export const DEFAULT_FREE_SERVICE_KEYS: PlatformServiceKey[] = [
  "basic_services",
  "mission_control",
];

/** Premium services admins toggle per user. */
export const ADMIN_CONTROLLABLE_SERVICE_KEYS: PlatformServiceKey[] = [
  "email_campaigns",
  "ai_call",
  "agents",
  "ads_management",
  "workflow_reporting",
];

/** Map dashboard paths → required service (longest prefix wins). */
export const ROUTE_SERVICE_REQUIREMENTS: Array<{
  prefix: string;
  serviceKey: PlatformServiceKey;
}> = [
  { prefix: "/dashboard/email-campaigns", serviceKey: "email_campaigns" },
  { prefix: "/dashboard/ai-calls", serviceKey: "ai_call" },
  { prefix: "/dashboard/agents", serviceKey: "agents" },
  { prefix: "/dashboard/campaign-ops", serviceKey: "ads_management" },
  { prefix: "/dashboard/ads", serviceKey: "ads_management" },
  { prefix: "/dashboard/campaigns", serviceKey: "ads_management" },
  { prefix: "/dashboard/engine", serviceKey: "ads_management" },
  { prefix: "/dashboard/growth-engine", serviceKey: "ads_management" },
  { prefix: "/dashboard/workflows", serviceKey: "workflow_reporting" },
  { prefix: "/dashboard/reports", serviceKey: "workflow_reporting" },
];

export function resolveRequiredServiceForPath(pathname: string): PlatformServiceKey {
  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    return "mission_control";
  }

  const sorted = [...ROUTE_SERVICE_REQUIREMENTS].sort(
    (a, b) => b.prefix.length - a.prefix.length,
  );
  for (const entry of sorted) {
    if (pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`)) {
      return entry.serviceKey;
    }
  }
  return "basic_services";
}
