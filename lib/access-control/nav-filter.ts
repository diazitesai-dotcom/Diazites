import { resolveRequiredServiceForPath } from "@/lib/access-control/constants";
import type { DashboardNavGroup } from "@/lib/navigation/platform-nav";
import type { PlatformServiceKey } from "@/types/access-control";

export function filterNavGroupsByAccess(
  groups: DashboardNavGroup[],
  enabledServiceKeys: PlatformServiceKey[],
  isOwnerAdmin: boolean,
): DashboardNavGroup[] {
  if (isOwnerAdmin) return groups;

  const enabled = new Set(enabledServiceKeys);

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const required = resolveRequiredServiceForPath(item.href);
        return enabled.has(required);
      }),
    }))
    .filter((group) => group.items.length > 0);
}
