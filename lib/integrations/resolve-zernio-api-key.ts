import type { SupabaseClient } from "@supabase/supabase-js";

import {
  findZernioConnection,
  listBusinessAdConnections,
  extractZernioApiKeyFromConnection,
} from "@/lib/integrations/business-ad-connections";
import { getZernioApiKeyFromEnv } from "@/lib/zernio";

/**
 * Resolves Zernio API key: per-business vault first (OAuth row or Marketing OS encrypted), then env.
 */
export async function resolveZernioApiKeyForBusiness(
  client: SupabaseClient,
  businessId: string,
): Promise<string | null> {
  const connections = await listBusinessAdConnections(client, businessId);
  const zernioRow = findZernioConnection(connections);
  const fromVault = extractZernioApiKeyFromConnection(zernioRow);
  if (fromVault) return fromVault;

  const envKey = getZernioApiKeyFromEnv();
  return envKey || null;
}
