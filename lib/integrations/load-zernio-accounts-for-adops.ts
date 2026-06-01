import type { SupabaseClient } from "@supabase/supabase-js";

import { zernioAccountsFromAdAccountMeta } from "@/lib/ads/zernio-adops-bridge";
import { isAdAccountRowConnected } from "@/lib/integrations/ad-account-connection";
import { resolveZernioApiKeyForBusiness } from "@/lib/integrations/resolve-zernio-api-key";
import { listAccounts, type ZernioAccount } from "@/lib/zernio";
import { createAdAccountRepository } from "@/repositories/ad-account.repository";

/** Loads live Zernio connected apps for Campaign Manager platform tiles. */
export async function loadZernioAccountsForAdops(
  client: SupabaseClient,
  businessId: string,
): Promise<ZernioAccount[]> {
  const accounts = createAdAccountRepository(client);
  const { data: zernioRow } = await accounts.getByPlatform(businessId, "zernio");
  const metaFallback = zernioAccountsFromAdAccountMeta(
    (zernioRow?.meta ?? {}) as Record<string, unknown>,
  );

  const key = await resolveZernioApiKeyForBusiness(client, businessId);
  if (!key) {
    return metaFallback;
  }

  try {
    const live = await listAccounts(key);
    if (live.length > 0) return live;
    return metaFallback;
  } catch {
    return metaFallback;
  }
}

export async function persistZernioConnectedPlatforms(
  client: SupabaseClient,
  businessId: string,
  platforms: string[],
  accountCount: number,
): Promise<void> {
  const accounts = createAdAccountRepository(client);
  const { data: row } = await accounts.getByPlatform(businessId, "zernio");
  if (!row || !isAdAccountRowConnected(row)) return;

  const meta = {
    ...((row.meta ?? {}) as Record<string, unknown>),
    connectedAppCount: accountCount,
    connectedPlatforms: platforms,
    lastSyncedAt: new Date().toISOString(),
  };

  await client
    .from("ad_accounts")
    .update({ meta })
    .eq("id", row.id)
    .eq("business_id", businessId);
}
