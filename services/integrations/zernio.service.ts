import type { SupabaseClient } from "@supabase/supabase-js";

import * as zernio from "@/lib/zernio";
import { fail, ok, type ServiceResult } from "@/lib/result";
import {
  createAdAccountRepository,
  type AdAccountRow,
} from "@/repositories/ad-account.repository";
import { createBusinessRepository } from "@/repositories/business.repository";

/**
 * Connect / verify a Diazites business to Zernio.
 *
 * The Zernio API key is stored on the existing `ad_accounts` table with
 * `platform = 'zernio'`. Migration 013 widens the platform check constraint
 * to allow that value. Each business stores its own key — we never share
 * keys across tenants.
 *
 * Why `ad_accounts` and not a new table? Zernio is itself an ads broker,
 * and the dashboard already enumerates `ad_accounts` to render connector
 * status. Storing Zernio there keeps a single source of truth for "which
 * upstream channels can this business push to?".
 */

export type ZernioConnectionStatus =
  | "disconnected"
  | "connected"
  | "error";

export type ZernioConnectionSummary = {
  status: ZernioConnectionStatus;
  accountCount: number;
  lastCheckedAt: string | null;
  errorMessage?: string;
};

async function ensureOwner(
  client: SupabaseClient,
  businessId: string,
  userId: string,
): Promise<ServiceResult<void>> {
  const businesses = createBusinessRepository(client);
  const { data: biz } = await businesses.getById(businessId);
  if (!biz || biz.user_id !== userId) {
    return fail("Forbidden", "FORBIDDEN");
  }
  return ok(undefined);
}

/**
 * Save (or replace) a business's Zernio API key after live-verifying it.
 * We never persist a key that doesn't actually work — connect always
 * implies a successful round-trip to /accounts.
 */
export async function connectZernio(
  client: SupabaseClient,
  args: { businessId: string; userId: string; apiKey: string },
): Promise<ServiceResult<{ accountCount: number }>> {
  const auth = await ensureOwner(client, args.businessId, args.userId);
  if (!auth.success) return auth;

  const trimmed = args.apiKey.trim();
  if (!trimmed) return fail("API key is required");
  if (!/^sk_[a-f0-9]{32,80}$/i.test(trimmed)) {
    return fail(
      "That doesn't look like a Zernio API key. Keys start with sk_ followed by hex characters.",
    );
  }

  let accountCount = 0;
  try {
    const verified = await zernio.verifyApiKey(trimmed);
    accountCount = verified.accountCount;
  } catch (err) {
    const message =
      err instanceof zernio.ZernioError
        ? err.message
        : err instanceof Error
        ? err.message
        : "Unknown error contacting Zernio";
    return fail(`Zernio rejected the key: ${message}`);
  }

  const repo = createAdAccountRepository(client);
  const { error } = await repo.upsert({
    businessId: args.businessId,
    platform: "zernio",
    status: "connected",
    accessToken: trimmed,
    tokenExpiresAt: null,
    scopes: ["zernio:full"],
    meta: {
      connectedAt: new Date().toISOString(),
      lastVerifiedAccountCount: accountCount,
    },
  });
  if (error) return fail(error.message);

  return ok({ accountCount });
}

export async function disconnectZernio(
  client: SupabaseClient,
  args: { businessId: string; userId: string },
): Promise<ServiceResult<{ ok: true }>> {
  const auth = await ensureOwner(client, args.businessId, args.userId);
  if (!auth.success) return auth;

  const repo = createAdAccountRepository(client);
  const { error } = await repo.disconnect(args.businessId, "zernio");
  if (error) return fail(error.message);

  return ok({ ok: true });
}

/**
 * Light health check — verifies the stored key still works without
 * touching `ad_accounts` (use for refresh buttons / dashboard rendering).
 */
export async function getZernioConnection(
  client: SupabaseClient,
  args: { businessId: string },
): Promise<ServiceResult<ZernioConnectionSummary>> {
  const repo = createAdAccountRepository(client);
  const { data: account, error } = await repo.getByPlatform(args.businessId, "zernio");
  if (error) return fail(error.message);

  if (!account || account.status === "disconnected" || !account.access_token) {
    return ok({ status: "disconnected", accountCount: 0, lastCheckedAt: null });
  }

  try {
    const verified = await zernio.verifyApiKey(account.access_token);
    return ok({
      status: "connected",
      accountCount: verified.accountCount,
      lastCheckedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error contacting Zernio";
    return ok({
      status: "error",
      accountCount: 0,
      lastCheckedAt: new Date().toISOString(),
      errorMessage: message,
    });
  }
}

export async function listZernioAccounts(
  client: SupabaseClient,
  args: { businessId: string },
): Promise<ServiceResult<zernio.ZernioAccount[]>> {
  const key = await getApiKey(client, args.businessId);
  if (!key.success) return key;
  try {
    const accounts = await zernio.listAccounts(key.data);
    return ok(accounts);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Zernio request failed");
  }
}

export async function listZernioProfiles(
  client: SupabaseClient,
  args: { businessId: string },
): Promise<ServiceResult<zernio.ZernioProfile[]>> {
  const key = await getApiKey(client, args.businessId);
  if (!key.success) return key;
  try {
    const profiles = await zernio.listProfiles(key.data);
    return ok(profiles);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Zernio request failed");
  }
}

/**
 * Cross-post via Zernio. Caller supplies pre-resolved (platform, accountId)
 * pairs — the connector card surfaces these to the user.
 */
export async function publishZernioPost(
  client: SupabaseClient,
  args: {
    businessId: string;
    userId: string;
    input: zernio.ZernioCreatePostInput;
  },
): Promise<ServiceResult<zernio.ZernioPost>> {
  const auth = await ensureOwner(client, args.businessId, args.userId);
  if (!auth.success) return auth;

  const key = await getApiKey(client, args.businessId);
  if (!key.success) return key;

  if (!args.input.content?.trim()) return fail("Post content is required");
  if (!args.input.platforms || args.input.platforms.length === 0) {
    return fail("Pick at least one platform + account to post to");
  }

  try {
    const post = await zernio.createPost(key.data, args.input);
    return ok(post);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Zernio post failed");
  }
}

/**
 * Internal: resolve a business's stored Zernio API key. Returns a typed
 * failure result rather than throwing, so callers can flow it straight
 * through their own ServiceResult.
 */
async function getApiKey(
  client: SupabaseClient,
  businessId: string,
): Promise<ServiceResult<string>> {
  const repo = createAdAccountRepository(client);
  const { data: account, error } = await repo.getByPlatform(businessId, "zernio");
  if (error) return fail(error.message);
  if (!account || account.status === "disconnected" || !account.access_token) {
    return fail("Zernio isn't connected for this business. Connect it on /dashboard/ads first.", "ZERNIO_NOT_CONNECTED");
  }
  return ok((account as AdAccountRow).access_token!);
}
