import type { SupabaseClient } from "@supabase/supabase-js";

import {
  isAdAccountRowConnected,
  type AdAccountConnectionRow,
} from "@/lib/integrations/ad-account-connection";
import { decryptCredentials } from "@/lib/crypto/credentials";

export type NormalizedAdConnection = AdAccountConnectionRow & {
  id?: string;
  meta: Record<string, unknown>;
};

function mergeMeta(row: Record<string, unknown>): Record<string, unknown> {
  const meta = (row.meta ?? {}) as Record<string, unknown>;
  const metadata = (row.metadata ?? {}) as Record<string, unknown>;
  return { ...metadata, ...meta };
}

export function normalizeAdConnectionRow(
  row: Record<string, unknown>,
): NormalizedAdConnection {
  return {
    id: typeof row.id === "string" ? row.id : undefined,
    platform: String(row.platform ?? ""),
    external_account_id:
      typeof row.external_account_id === "string" ? row.external_account_id : null,
    status: typeof row.status === "string" ? row.status : null,
    connection_status:
      typeof row.connection_status === "string" ? row.connection_status : null,
    access_token: typeof row.access_token === "string" ? row.access_token : null,
    credentials_encrypted:
      typeof row.credentials_encrypted === "string" ? row.credentials_encrypted : null,
    meta: mergeMeta(row),
  };
}

/** Loads all ad account rows for a business (select * avoids missing-column failures). */
export async function listBusinessAdConnections(
  client: SupabaseClient,
  businessId: string,
): Promise<NormalizedAdConnection[]> {
  const { data, error } = await client
    .from("ad_accounts")
    .select("*")
    .eq("business_id", businessId);

  if (error || !data?.length) return [];
  return data.map((row) => normalizeAdConnectionRow(row as Record<string, unknown>));
}

export function businessHasAnyConnectedIntegration(
  connections: NormalizedAdConnection[],
): boolean {
  return connections.some((row) => isAdAccountRowConnected(row));
}

export function findZernioConnection(
  connections: NormalizedAdConnection[],
): NormalizedAdConnection | null {
  return (
    connections.find(
      (row) =>
        String(row.platform).toLowerCase() === "zernio" && isAdAccountRowConnected(row),
    ) ?? null
  );
}

/** Reads Zernio API key from engine access_token or Marketing OS encrypted vault. */
/** Dual-write engine OAuth columns when Zernio was saved only to Marketing OS vault. */
export async function ensureZernioEngineAccessToken(
  client: SupabaseClient,
  businessId: string,
): Promise<void> {
  const connections = await listBusinessAdConnections(client, businessId);
  const zernio = findZernioConnection(connections);
  const apiKey = extractZernioApiKeyFromConnection(zernio);
  if (!apiKey || !zernio) return;

  if (zernio.access_token?.trim() === apiKey) return;

  const { createAdAccountRepository } = await import("@/repositories/ad-account.repository");
  const engineAccounts = createAdAccountRepository(client);
  await engineAccounts.upsert({
    businessId,
    platform: "zernio",
    externalAccountId: "zernio",
    accountName: "Zernio",
    accessToken: apiKey,
    status: "connected",
    meta: {
      ...zernio.meta,
      accountLabel: "Zernio",
      lastSyncedAt: new Date().toISOString(),
    },
  });
}

export function extractZernioApiKeyFromConnection(
  row: NormalizedAdConnection | null,
): string | null {
  if (!row || !isAdAccountRowConnected(row)) return null;

  const direct = row.access_token?.trim();
  if (direct) return direct;

  const encrypted = row.credentials_encrypted?.trim();
  if (!encrypted) return null;

  try {
    const plaintext = decryptCredentials(encrypted);
    const parsed = JSON.parse(plaintext) as Record<string, unknown>;
    const candidates = [parsed.token, parsed.api_key, parsed.apiKey];
    const token = candidates.find(
      (v): v is string => typeof v === "string" && v.trim().length > 0,
    );
    return token?.trim() ?? null;
  } catch {
    return null;
  }
}
