import type { SupabaseClient } from "@supabase/supabase-js";

import { getZernioApiKeyFromEnv } from "@/lib/zernio";
import { createAdAccountRepository } from "@/repositories/ad-account.repository";

/**
 * Resolves Zernio API key: per-business vault first, then server env fallback.
 */
export async function resolveZernioApiKeyForBusiness(
  client: SupabaseClient,
  businessId: string,
): Promise<string | null> {
  const accounts = createAdAccountRepository(client);
  const { data } = await accounts.getByPlatform(businessId, "zernio");
  if (data?.status === "connected" && data.access_token?.trim()) {
    return data.access_token.trim();
  }
  const envKey = getZernioApiKeyFromEnv();
  return envKey || null;
}
