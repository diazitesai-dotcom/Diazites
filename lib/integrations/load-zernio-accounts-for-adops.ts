import type { SupabaseClient } from "@supabase/supabase-js";

import { resolveZernioApiKeyForBusiness } from "@/lib/integrations/resolve-zernio-api-key";
import { listAccounts, type ZernioAccount } from "@/lib/zernio";

/** Loads live Zernio connected apps for Campaign Manager platform tiles. */
export async function loadZernioAccountsForAdops(
  client: SupabaseClient,
  businessId: string,
): Promise<ZernioAccount[]> {
  const key = await resolveZernioApiKeyForBusiness(client, businessId);
  if (!key) return [];
  try {
    return await listAccounts(key);
  } catch {
    return [];
  }
}
