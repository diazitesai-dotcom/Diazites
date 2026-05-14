import type { SupabaseClient } from "@supabase/supabase-js";

import * as zernio from "@/lib/zernio";
import { fail, ok, type ServiceResult } from "@/lib/result";
import {
  createAdAccountRepository,
  createAdCampaignRepository,
  type AdCampaignRow,
} from "@/repositories/ad-account.repository";
import { createEngineRepository } from "@/repositories/engine.repository";
import { triggerEvent } from "@/services/events/event-dispatcher";
import { EVENT_TYPES } from "@/types/backend";

/**
 * Push the engine's winning ad asset to the user's connected Zernio
 * accounts.
 *
 * Unlike the Meta service (which is stubbed against the Graph API until
 * real credentials are wired), the Zernio path is *real*: Zernio brokers
 * the underlying platform OAuth + posting, so all we need is a valid
 * Zernio API key for the business.
 *
 * The push records exactly one `ad_campaigns` row regardless of how many
 * social accounts the post was fanned out to — `platform = 'zernio'` and
 * the per-platform breakdown lives in `detail.targets`. This keeps the
 * dashboard rollup honest (one push = one campaign) while preserving the
 * fan-out detail for the optimization loop.
 */

export type PushZernioCreativeResult = {
  adCampaignId: string;
  zernioPostId: string;
  targets: Array<{ platform: zernio.ZernioPlatform; accountId: string }>;
  mode: "now" | "scheduled" | "draft";
};

export async function pushZernioCreative(
  client: SupabaseClient,
  args: {
    businessId: string;
    engineRunId: string;
    winningAssetId: string;
    name: string;
    dailyBudgetUsd: number;
    // Optional: caller can scope the cross-post to a subset of accounts.
    // When empty/omitted we post to every account Zernio has connected.
    targets?: Array<{ platform: zernio.ZernioPlatform; accountId: string }>;
    mode?: "now" | "scheduled" | "draft";
    scheduledFor?: string;
  },
): Promise<ServiceResult<PushZernioCreativeResult>> {
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

  const engineRepo = createEngineRepository(client);
  const { data: asset, error: assetErr } = await engineRepo.getAsset(args.winningAssetId);
  if (assetErr) return fail(assetErr.message);
  if (!asset) return fail("Winning asset not found.");
  if (asset.kind !== "ad") {
    return fail(
      "Selected asset is not an ad — pick the winning ad variant for the Zernio push.",
    );
  }

  const content = composeAdContent(asset.payload);
  if (!content.trim()) {
    return fail("Winning ad asset has no usable copy to post.");
  }

  let targets = args.targets;
  if (!targets || targets.length === 0) {
    try {
      const allAccounts = await zernio.listAccounts(account.access_token);
      targets = allAccounts.map((a) => ({
        platform: a.platform,
        accountId: a._id,
      }));
    } catch (err) {
      return fail(
        `Couldn't list Zernio accounts: ${err instanceof Error ? err.message : "unknown"}`,
      );
    }
  }
  if (targets.length === 0) {
    return fail(
      "No social accounts are connected inside Zernio yet. Connect at least one at zernio.com and try again.",
    );
  }

  const mode = args.mode ?? "now";
  const input: zernio.ZernioCreatePostInput = {
    content,
    platforms: targets,
    timezone: "UTC",
  };
  if (mode === "now") {
    input.publishNow = true;
  } else if (mode === "draft") {
    input.isDraft = true;
  } else if (mode === "scheduled" && args.scheduledFor) {
    input.scheduledFor = args.scheduledFor;
  } else if (mode === "scheduled") {
    return fail("Scheduled mode requires a scheduledFor timestamp.");
  }

  let post: zernio.ZernioPost;
  try {
    post = await zernio.createPost(account.access_token, input);
  } catch (err) {
    return fail(
      `Zernio rejected the post: ${err instanceof Error ? err.message : "unknown"}`,
    );
  }

  const campaignRepo = createAdCampaignRepository(client);
  const { data: campaign, error: campErr } = await campaignRepo.insert({
    businessId: args.businessId,
    adAccountId: account.id,
    engineRunId: args.engineRunId,
    winningAssetId: args.winningAssetId,
    platform: "zernio",
    name: args.name,
    status: mode === "now" ? "active" : mode === "scheduled" ? "pending" : "draft",
    dailyBudgetUsd: args.dailyBudgetUsd,
    detail: {
      via: "zernio",
      zernioPostId: post._id,
      mode,
      targets,
      contentPreview: content.slice(0, 200),
      adPayload: asset.payload,
    },
  });
  if (campErr || !campaign) {
    return fail(campErr?.message ?? "Failed to record Zernio campaign locally");
  }

  // Stash Zernio's post id on the campaign as external_campaign_id so the
  // sync job can map back later.
  await campaignRepo.updateMetrics(campaign.id, {
    externalCampaignId: post._id,
  });

  // Fire-and-forget telemetry: feeds Zapier rules subscribed to
  // AD_CAMPAIGN_PUSHED.
  try {
    await triggerEvent(client, {
      type: EVENT_TYPES.AD_CAMPAIGN_PUSHED,
      businessId: args.businessId,
      payload: {
        adCampaignId: campaign.id,
        platform: "zernio",
        zernioPostId: post._id,
        mode,
        targetCount: targets.length,
        engineRunId: args.engineRunId,
      },
    });
  } catch {
    // swallow
  }

  return ok({
    adCampaignId: (campaign as AdCampaignRow).id,
    zernioPostId: post._id,
    targets,
    mode,
  });
}

/**
 * Compose the post body from an "ad" engine asset. The variants AI returns
 * { primaryText, headline, description, imagePrompt, cta }. We fold these
 * into a single Zernio post body since cross-posting is content-only — the
 * imagePrompt is dropped (Zernio media upload is a separate browser flow).
 */
function composeAdContent(payload: Record<string, unknown>): string {
  const headline = strOrEmpty(payload.headline);
  const primaryText = strOrEmpty(payload.primaryText);
  const description = strOrEmpty(payload.description);
  const cta = strOrEmpty(payload.cta);

  const parts: string[] = [];
  if (headline) parts.push(headline);
  if (primaryText) parts.push(primaryText);
  if (description && description !== primaryText) parts.push(description);
  if (cta) parts.push(`→ ${cta}`);
  return parts.join("\n\n");
}

function strOrEmpty(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
