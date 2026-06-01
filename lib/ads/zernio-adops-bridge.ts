import type { ZernioAccount } from "@/lib/zernio";
import type { AdopsPlatformId } from "@/lib/ads/adops-types";

/** Maps Campaign Manager platform tiles → Zernio social platform ids. */
const ADOPS_TO_ZERNIO: Partial<Record<AdopsPlatformId, string[]>> = {
  meta: ["facebook", "instagram"],
  youtube: ["youtube"],
  tiktok: ["tiktok"],
  linkedin: ["linkedin"],
  x: ["twitter"],
  pinterest: ["pinterest"],
  snapchat: ["snapchat"],
  reddit: ["reddit"],
};

export function zernioAccountsForAdopsPlatform(
  platformId: AdopsPlatformId,
  accounts: ZernioAccount[],
): ZernioAccount[] {
  const keys = ADOPS_TO_ZERNIO[platformId];
  if (!keys?.length) return [];
  return accounts.filter((a) => keys.includes(a.platform));
}

export function adopsPlatformLinkedViaZernio(
  platformId: AdopsPlatformId,
  accounts: ZernioAccount[],
): boolean {
  return zernioAccountsForAdopsPlatform(platformId, accounts).length > 0;
}

export function mapZernioAccountsToWorkspaceAccounts(
  platformId: AdopsPlatformId,
  businessName: string,
  accounts: ZernioAccount[],
): Array<{
  id: string;
  businessName: string;
  accountName: string;
  accountId: string;
  status: string;
  spendToday: number;
  currency: string;
  platformId: AdopsPlatformId;
}> {
  return zernioAccountsForAdopsPlatform(platformId, accounts).map((a) => ({
    id: a._id,
    businessName,
    accountName: a.displayName ?? a.username ?? a.platform,
    accountId: a._id,
    status: a.status ?? "active",
    spendToday: 0,
    currency: "USD",
    platformId,
  }));
}
