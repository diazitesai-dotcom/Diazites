/**
 * Pure helpers for access-control verification (no database).
 * Run: npx tsx lib/access-control/verify-access-control.ts
 */

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
  assert(DEFAULT_FREE_SERVICE_KEYS.length === 2, "only two free defaults");
}

export function verifyNavFilteringHidesPremiumTabs() {
  const freeOnly: PlatformServiceKey[] = ["basic_services", "mission_control"];
  const filtered = filterNavGroupsByAccess(GROWTH_SIDEBAR_GROUPS, freeOnly, false);
  const hrefs = filtered.flatMap((g) => g.items.map((i) => i.href));
  assert(!hrefs.some((h) => h.includes("email-campaigns")), "email hidden");
  assert(!hrefs.some((h) => h.includes("ai-calls")), "ai calls hidden");
  assert(!hrefs.some((h) => h.includes("/agents")), "agents hidden");
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
