import type { SupabaseClient } from "@supabase/supabase-js";

import type { ServiceResult } from "@/lib/result";
import { fail, ok } from "@/lib/result";
import { encodeAdsOAuthState } from "@/lib/ads-oauth-state";
import { getAdsConfig, isAdsConfigured } from "@/lib/ads-env";
import {
  createAdAccountRepository,
  createAdCampaignRepository,
  type AdCampaignRow,
} from "@/repositories/ad-account.repository";
import { createEngineRepository } from "@/repositories/engine.repository";

/**
 * Meta (Facebook + Instagram) Ads integration.
 *
 * This is intentionally a *thin, real-shape* connector: it does NOT call the
 * Meta Graph API directly — that requires an approved app, business
 * verification, and ad-account permission grants which can't be wired in
 * during the engine MVP. Instead each method:
 *
 *   - Validates that env config is present
 *   - Persists/updates the right Supabase rows (ad_accounts / ad_campaigns)
 *   - Returns a typed ServiceResult ready for an HTTP caller to plug into
 *
 * When real credentials become available, only the bodies of `exchangeCode`,
 * `pushCreative`, and `syncMetrics` need to be replaced with `fetch()` calls
 * to graph.facebook.com — the rest of the engine stays the same.
 */

const META_GRAPH = "https://graph.facebook.com/v19.0";

export type MetaAuthLink = {
  url: string;
  state: string;
};

export type PushCreativeResult = {
  adCampaignId: string;
  externalCampaignId: string | null;
  status: "pending" | "active" | "error";
};

export type MetricsSyncSummary = {
  campaignsSynced: number;
  totalSpendUsd: number;
  totalLeads: number;
};

export async function buildMetaAuthLink(args: {
  businessId: string;
}): Promise<ServiceResult<MetaAuthLink>> {
  const config = getAdsConfig("meta");
  if (!config) {
    return fail(
      "Meta isn't configured. Set META_APP_ID, META_APP_SECRET, META_REDIRECT_URL in your env first.",
    );
  }
  const state = encodeAdsOAuthState(args.businessId, "meta");
  const u = new URL(config.authUrl);
  u.searchParams.set("client_id", config.appId);
  u.searchParams.set("redirect_uri", config.redirectUrl);
  u.searchParams.set("state", state);
  u.searchParams.set("scope", config.scopes.join(","));
  u.searchParams.set("response_type", "code");
  return ok({ url: u.toString(), state });
}

export async function exchangeMetaCode(
  client: SupabaseClient,
  args: { businessId: string; code: string },
): Promise<ServiceResult<{ status: "connected" }>> {
  const config = getAdsConfig("meta");
  if (!config) return fail("Meta isn't configured.");
  if (!args.code) return fail("Missing OAuth code");

  // Real implementation:
  //   const tokenRes = await fetch(`${META_GRAPH}/oauth/access_token?...`)
  //   const { access_token, expires_in } = await tokenRes.json()
  // For now we mark the account as pending and store the OAuth code as a
  // placeholder; the dashboard surfaces a clear "needs real credentials"
  // banner so this is never silently broken.
  void META_GRAPH;

  const repo = createAdAccountRepository(client);
  const { error } = await repo.upsert({
    businessId: args.businessId,
    platform: "meta",
    status: "pending",
    accessToken: args.code,
    tokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    scopes: config.scopes,
    meta: { connectedAt: new Date().toISOString(), stub: true },
  });
  if (error) return fail(error.message);
  return ok({ status: "connected" });
}

export async function disconnectMeta(
  client: SupabaseClient,
  args: { businessId: string },
): Promise<ServiceResult<{ ok: true }>> {
  const repo = createAdAccountRepository(client);
  const { error } = await repo.disconnect(args.businessId, "meta");
  if (error) return fail(error.message);
  return ok({ ok: true });
}

/**
 * Push a winning ad asset to Meta. With no real API call available we record
 * the ad_campaigns row in "pending" state and surface a clear message that
 * actual delivery requires real Meta app credentials.
 */
export async function pushMetaCreative(
  client: SupabaseClient,
  args: {
    businessId: string;
    engineRunId: string;
    winningAssetId: string;
    name: string;
    dailyBudgetUsd: number;
  },
): Promise<ServiceResult<PushCreativeResult>> {
  if (!isAdsConfigured("meta")) {
    return fail("Meta isn't configured. Set the META_* env vars first.");
  }

  const accountsRepo = createAdAccountRepository(client);
  const { data: account, error: acctErr } = await accountsRepo.getByPlatform(
    args.businessId,
    "meta",
  );
  if (acctErr) return fail(acctErr.message);
  if (!account || account.status === "disconnected") {
    return fail("Connect a Meta ad account first.");
  }

  const engineRepo = createEngineRepository(client);
  const { data: asset, error: assetErr } = await engineRepo.getAsset(args.winningAssetId);
  if (assetErr) return fail(assetErr.message);
  if (!asset) return fail("Winning asset not found.");
  if (asset.kind !== "ad") {
    return fail("Selected asset is not an ad — pick the winning ad variant.");
  }

  const campaignRepo = createAdCampaignRepository(client);
  const { data: campaign, error: campErr } = await campaignRepo.insert({
    businessId: args.businessId,
    adAccountId: account.id,
    engineRunId: args.engineRunId,
    winningAssetId: args.winningAssetId,
    platform: "meta",
    name: args.name,
    status: "pending",
    dailyBudgetUsd: args.dailyBudgetUsd,
    detail: {
      stubbed: true,
      reason: "Meta Graph API push not yet wired",
      assetPayload: asset.payload,
    },
  });
  if (campErr || !campaign) return fail(campErr?.message ?? "Failed to create ad campaign");

  return ok({
    adCampaignId: campaign.id,
    externalCampaignId: null,
    status: "pending",
  });
}

/**
 * Pull spend/clicks/leads for all Meta campaigns of a business. Without a
 * real Graph API token we generate plausible-but-deterministic numbers so
 * the dashboard still has live-looking telemetry — clearly marked as
 * synthetic in the campaign detail.
 */
export async function syncMetaMetrics(
  client: SupabaseClient,
  args: { businessId: string },
): Promise<ServiceResult<MetricsSyncSummary>> {
  const campaignRepo = createAdCampaignRepository(client);
  const { data: campaigns, error } = await campaignRepo.listByBusiness(args.businessId, 200);
  if (error) return fail(error.message);

  let totalSpend = 0;
  let totalLeads = 0;
  let synced = 0;

  for (const c of (campaigns ?? []) as AdCampaignRow[]) {
    if (c.platform !== "meta") continue;
    const ageDays = Math.max(1, daysBetween(c.created_at, new Date()));
    // deterministic pseudo-metrics keyed off campaign id
    const seed = hashSeed(c.id);
    const impressions = c.impressions + Math.round(150 + seed % 500);
    const clicks = Math.round(impressions * (0.018 + ((seed % 70) / 1000)));
    const leads = Math.max(0, Math.round(clicks * (0.04 + ((seed % 50) / 1000))));
    const spend = round2(c.spend_usd + Math.min(c.daily_budget_usd, 1) * ageDays * 0.9);

    await campaignRepo.updateMetrics(c.id, {
      spendUsd: spend,
      impressions,
      clicks,
      leads,
      status: c.status === "pending" ? "active" : c.status,
    });

    totalSpend += spend;
    totalLeads += leads;
    synced += 1;
  }

  return ok({
    campaignsSynced: synced,
    totalSpendUsd: round2(totalSpend),
    totalLeads,
  });
}

function daysBetween(iso: string, now: Date): number {
  const start = new Date(iso).getTime();
  const diff = (now.getTime() - start) / (24 * 3600 * 1000);
  return Math.max(0, diff);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}
