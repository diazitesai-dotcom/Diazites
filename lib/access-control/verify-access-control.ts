import { DEFAULT_FREE_SERVICE_KEYS } from "@/lib/access-control/constants";
import { filterNavGroupsByAccess } from "@/lib/access-control/nav-filter";
import { GROWTH_SIDEBAR_GROUPS } from "@/lib/navigation/platform-nav";
import type { PlatformServiceKey } from "@/types/access-control";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

export function verifyDefaultFreeServices() {
  assert(DEFAULT_FREE_SERVICE_KEYS.includes("basic_services"), "basic_services default");
  assert(DEFAULT_FREE_SERVICE_KEYS.includes("mission_control"), "mission_control default");
  assert(DEFAULT_FREE_SERVICE_KEYS.includes("email_campaigns"), "email_campaigns default");
  assert(DEFAULT_FREE_SERVICE_KEYS.includes("ai_call"), "ai_call default");
  assert(DEFAULT_FREE_SERVICE_KEYS.includes("workflow_reporting"), "workflow_reporting default");
  assert(DEFAULT_FREE_SERVICE_KEYS.length === 5, "five free defaults");
}

export function verifyNavFilteringHidesPremiumTabs() {
  const freeOnly: PlatformServiceKey[] = [...DEFAULT_FREE_SERVICE_KEYS];
  const filtered = filterNavGroupsByAccess(GROWTH_SIDEBAR_GROUPS, freeOnly, false);
  const hrefs = filtered.flatMap((g) => g.items.map((i) => i.href));
  assert(hrefs.some((h) => h.includes("email-campaigns")), "email visible for starter");
  assert(hrefs.some((h) => h.includes("ai-calls")), "ai calls visible for starter");
  assert(hrefs.some((h) => h.includes("/dashboard/funnel")), "funnel studio under automation");
  assert(!hrefs.some((h) => h.includes("/agents")), "agents hidden");
  assert(!hrefs.some((h) => h.includes("campaign-ops")), "campaign ops hidden");
  assert(hrefs.some((h) => h === "/dashboard"), "mission control visible");
}

export function verifyAdminSeesFullNav() {
  const filtered = filterNavGroupsByAccess(GROWTH_SIDEBAR_GROUPS, [], true);
  const defaultCount = GROWTH_SIDEBAR_GROUPS.flatMap((g) => g.items).length;
  const filteredCount = filtered.flatMap((g) => g.items).length;
  assert(filteredCount === defaultCount, "admin sees all nav items");
}

export function runAccessControlVerification() {
  verifyDefaultFreeServices();
  verifyNavFilteringHidesPremiumTabs();
  verifyAdminSeesFullNav();
  return true;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const isDirectRun = typeof process !== "undefined" && process.argv[1]?.includes("verify-access-control");
if (isDirectRun) {
  runAccessControlVerification();
  console.log("access-control verification passed");
}
