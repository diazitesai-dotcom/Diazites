import type { SupabaseClient } from "@supabase/supabase-js";

import { zernioAccountsFromAdAccountMeta } from "@/lib/ads/zernio-adops-bridge";
import {
  ensureZernioEngineAccessToken,
  findZernioConnection,
  listBusinessAdConnections,
} from "@/lib/integrations/business-ad-connections";
import { resolveZernioApiKeyForBusiness } from "@/lib/integrations/resolve-zernio-api-key";
import { listAccounts, type ZernioAccount } from "@/lib/zernio";

/** Loads live Zernio connected apps for Campaign Manager platform tiles. */
export async function loadZernioAccountsForAdops(
  client: SupabaseClient,
  businessId: string,
): Promise<ZernioAccount[]> {
  await ensureZernioEngineAccessToken(client, businessId);
  const connections = await listBusinessAdConnections(client, businessId);
  const zernioRow = findZernioConnection(connections);
  const metaFallback = zernioAccountsFromAdAccountMeta(zernioRow?.meta ?? {});

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
  const connections = await listBusinessAdConnections(client, businessId);
  const row = findZernioConnection(connections);
  if (!row?.id) return;

  const meta = {
    ...row.meta,
    connectedAppCount: accountCount,
    connectedPlatforms: platforms,
    lastSyncedAt: new Date().toISOString(),
  };

  const basePatch = { updated_at: new Date().toISOString() };
  const withMeta = await client
    .from("ad_accounts")
    .update({ ...basePatch, meta })
    .eq("id", row.id)
    .eq("business_id", businessId);
  if (withMeta.error) {
    await client
      .from("ad_accounts")
      .update({ ...basePatch, metadata: meta })
      .eq("id", row.id)
      .eq("business_id", businessId);
  }
}
