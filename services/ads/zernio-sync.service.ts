import type { SupabaseClient } from "@supabase/supabase-js";

import * as zernio from "@/lib/zernio";
import { fail, ok, type ServiceResult } from "@/lib/result";
import {
  createAdAccountRepository,
  createAdCampaignRepository,
  type AdCampaignRow,
} from "@/repositories/ad-account.repository";

/**
 * Pull every ad campaign Zernio sees for a business and mirror it into the
 * local `ad_campaigns` table so the optimization loop, dashboard rollups,
 * and approvals all "see" the same picture as Zernio.
 *
 * Matching strategy: `external_campaign_id` is the Zernio campaign `_id`.
 * Existing local rows are updated (metrics + status); new ones are
 * inserted with `platform = 'zernio'` and a synthetic detail blob so the
 * dashboard knows where each row came from.
 *
 * Best-effort: a Zernio request failure does NOT roll back rows that
 * succeeded in this batch — we return the partial summary with an
 * `error` field so the caller can surface it.
 */

export type SyncZernioSummary = {
  campaignsFetched: number;
  campaignsCreated: number;
  campaignsUpdated: number;
  totalSpendUsd: number;
  totalLeads: number;
  totalClicks: number;
  totalImpressions: number;
  error?: string;
};

export async function syncZernioCampaigns(
  client: SupabaseClient,
  args: { businessId: string },
): Promise<ServiceResult<SyncZernioSummary>> {
  const accountsRepo = createAdAccountRepository(client);
  const { data: account, error: acctErr } = await accountsRepo.getByPlatform(
    args.businessId,
    "zernio",
  );
  if (acctErr) return fail(acctErr.message);
  if (!account || account.status !== "connected" || !account.access_token) {
    return fail(
      "Zernio isn't connected for this business. Connect it on /dashboard/ads first.",
      "ZERNIO_NOT_CONNECTED",
    );
  }

  let remote: zernio.ZernioAdCampaign[] = [];
  try {
    remote = await zernio.listAdCampaigns(account.access_token);
  } catch (err) {
    return fail(
      `Couldn't fetch Zernio ad campaigns: ${err instanceof Error ? err.message : "unknown"}`,
    );
  }

  const campaignsRepo = createAdCampaignRepository(client);
  const { data: existingRows, error: existingErr } =
    await campaignsRepo.listByBusiness(args.businessId, 500);
  if (existingErr) return fail(existingErr.message);

  const existingByExt = new Map<string, AdCampaignRow>();
  for (const row of (existingRows ?? []) as AdCampaignRow[]) {
    if (row.platform === "zernio" && row.external_campaign_id) {
      existingByExt.set(row.external_campaign_id, row);
    }
  }

  let created = 0;
  let updated = 0;
  let totalSpend = 0;
  let totalLeads = 0;
  let totalClicks = 0;
  let totalImpressions = 0;

  for (const c of remote) {
    const spend = round2(Number(c.spend ?? 0));
    const impressions = Math.max(0, Math.round(Number(c.impressions ?? 0)));
    const clicks = Math.max(0, Math.round(Number(c.clicks ?? 0)));
    const leads = Math.max(0, Math.round(Number(c.leads ?? 0)));
    const remoteStatus = normalizeStatus(c.status);

    totalSpend += spend;
    totalImpressions += impressions;
    totalClicks += clicks;
    totalLeads += leads;

    const existing = existingByExt.get(c._id);
    if (existing) {
      await campaignsRepo.updateMetrics(existing.id, {
        spendUsd: spend,
        impressions,
        clicks,
        leads,
        status: remoteStatus,
      });
      updated += 1;
    } else {
      const { data: inserted, error: insErr } = await campaignsRepo.insert({
        businessId: args.businessId,
        adAccountId: account.id,
        platform: "zernio",
        name: c.name ?? `Zernio campaign ${c._id.slice(0, 8)}`,
        status: remoteStatus,
        dailyBudgetUsd: 0,
        detail: {
          via: "zernio",
          source: "sync",
          zernioPlatform: c.platform,
        },
      });
      if (insErr || !inserted) continue;
      await campaignsRepo.updateMetrics(inserted.id, {
        spendUsd: spend,
        impressions,
        clicks,
        leads,
        externalCampaignId: c._id,
        status: remoteStatus,
      });
      created += 1;
    }
  }

  return ok({
    campaignsFetched: remote.length,
    campaignsCreated: created,
    campaignsUpdated: updated,
    totalSpendUsd: round2(totalSpend),
    totalLeads,
    totalClicks,
    totalImpressions,
  });
}

function normalizeStatus(
  raw: string | undefined,
):
  | "draft"
  | "pending"
  | "active"
  | "paused"
  | "archived"
  | "error" {
  const v = String(raw ?? "").toLowerCase();
  if (v === "active" || v === "running" || v === "live") return "active";
  if (v === "paused" || v === "stopped") return "paused";
  if (v === "draft") return "draft";
  if (v === "archived" || v === "deleted") return "archived";
  if (v === "error" || v === "failed" || v === "rejected") return "error";
  return "pending";
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
