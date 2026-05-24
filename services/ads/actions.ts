"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { logAudit } from "@/lib/audit/log";
import { requireAuth } from "@/lib/auth/session";
import { fail, ok, type ServiceResult } from "@/lib/result";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";

import type { AdsPlatform } from "@/lib/ads-env";
import {
  buildGoogleAuthLink,
  disconnectGoogle,
} from "@/services/ads/google.service";
import {
  buildMetaAuthLink,
  disconnectMeta,
  pushMetaCreative,
  syncMetaMetrics,
  type MetricsSyncSummary,
  type PushCreativeResult,
} from "@/services/ads/meta.service";
import {
  pushZernioCreative,
  type PushZernioCreativeResult,
} from "@/services/ads/zernio-launch.service";

async function resolveBusinessId(): Promise<{ businessId: string; userId: string } | null> {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business) return null;
  return { businessId: business.id, userId: user.id };
}

export async function startMetaConnectAction(): Promise<ServiceResult<{ url: string }>> {
  return startAdsConnectAction("meta");
}

export async function startGoogleConnectAction(): Promise<ServiceResult<{ url: string }>> {
  return startAdsConnectAction("google");
}

export async function startAdsConnectAction(
  platform: Extract<AdsPlatform, "meta" | "google">,
): Promise<ServiceResult<{ url: string }>> {
  const ctx = await resolveBusinessId();
  if (!ctx) redirect("/onboarding?error=Complete+onboarding+first");

  const link =
    platform === "google"
      ? await buildGoogleAuthLink({ businessId: ctx.businessId })
      : await buildMetaAuthLink({ businessId: ctx.businessId });
  if (!link.success) return fail(link.error);
  return ok({ url: link.data.url });
}

export async function disconnectMetaAction(): Promise<ServiceResult<{ ok: true }>> {
  return disconnectAdsPlatformAction("meta");
}

export async function disconnectGoogleAction(): Promise<ServiceResult<{ ok: true }>> {
  return disconnectAdsPlatformAction("google");
}

export async function disconnectAdsPlatformAction(
  platform: Extract<AdsPlatform, "meta" | "google">,
): Promise<ServiceResult<{ ok: true }>> {
  const ctx = await resolveBusinessId();
  if (!ctx) return fail("No business found");

  const supabase = await createServerSupabaseClient();
  const result =
    platform === "google"
      ? await disconnectGoogle(supabase, { businessId: ctx.businessId })
      : await disconnectMeta(supabase, { businessId: ctx.businessId });
  if (!result.success) return fail(result.error);

  await logAudit(supabase, {
    businessId: ctx.businessId,
    actorUserId: ctx.userId,
    action: platform === "google" ? "ads.google.disconnect" : "ads.meta.disconnect",
    targetKind: "ad_account",
  });

  revalidatePath("/dashboard/ads");
  return ok({ ok: true });
}

export async function pushWinningCreativeAction(
  formData: FormData,
): Promise<ServiceResult<PushCreativeResult>> {
  const ctx = await resolveBusinessId();
  if (!ctx) return fail("No business found");

  const engineRunId = pickString(formData.get("engine_run_id"));
  const winningAssetId = pickString(formData.get("winning_asset_id"));
  const name = pickString(formData.get("name")) ?? "Engine campaign";
  const budgetRaw = pickString(formData.get("daily_budget_usd"));
  const dailyBudgetUsd = budgetRaw ? Number(budgetRaw) : 10;

  if (!engineRunId || !winningAssetId) {
    return fail("Missing engine run id or winning asset id");
  }

  const supabase = await createServerSupabaseClient();
  const result = await pushMetaCreative(supabase, {
    businessId: ctx.businessId,
    engineRunId,
    winningAssetId,
    name,
    dailyBudgetUsd: Number.isFinite(dailyBudgetUsd) ? dailyBudgetUsd : 10,
  });
  if (!result.success) return fail(result.error);

  await logAudit(supabase, {
    businessId: ctx.businessId,
    actorUserId: ctx.userId,
    action: "ads.meta.push_creative",
    targetKind: "ad_campaign",
    targetId: result.data.adCampaignId,
    metadata: { engineRunId, winningAssetId, dailyBudgetUsd },
  });

  revalidatePath("/dashboard/ads");
  return ok(result.data);
}

export async function syncMetaMetricsAction(): Promise<ServiceResult<MetricsSyncSummary>> {
  const ctx = await resolveBusinessId();
  if (!ctx) return fail("No business found");

  const supabase = await createServerSupabaseClient();
  const result = await syncMetaMetrics(supabase, { businessId: ctx.businessId });
  if (!result.success) return fail(result.error);

  await logAudit(supabase, {
    businessId: ctx.businessId,
    actorUserId: ctx.userId,
    action: "ads.meta.sync_metrics",
    metadata: { summary: result.data },
  });

  revalidatePath("/dashboard/ads");
  return ok(result.data);
}

export async function pushZernioCreativeAction(
  formData: FormData,
): Promise<ServiceResult<PushZernioCreativeResult>> {
  const ctx = await resolveBusinessId();
  if (!ctx) return fail("No business found");

  const engineRunId = pickString(formData.get("engine_run_id"));
  const winningAssetId = pickString(formData.get("winning_asset_id"));
  const name = pickString(formData.get("name")) ?? "Zernio campaign";
  const budgetRaw = pickString(formData.get("daily_budget_usd"));
  const dailyBudgetUsd = budgetRaw ? Number(budgetRaw) : 25;
  const mode = (pickString(formData.get("mode")) ?? "now") as "now" | "scheduled" | "draft";
  const scheduledFor = pickString(formData.get("scheduled_for"));

  const targetsRaw = pickString(formData.get("targets"));
  let targets: Array<{ platform: import("@/lib/zernio").ZernioPlatform; accountId: string }> | undefined;
  if (targetsRaw) {
    try {
      targets = JSON.parse(targetsRaw) as typeof targets;
    } catch {
      return fail("Invalid targets JSON");
    }
  }

  if (!engineRunId || !winningAssetId) {
    return fail("Missing engine run id or winning asset id");
  }

  const supabase = await createServerSupabaseClient();
  const result = await pushZernioCreative(supabase, {
    businessId: ctx.businessId,
    engineRunId,
    winningAssetId,
    name,
    dailyBudgetUsd: Number.isFinite(dailyBudgetUsd) ? dailyBudgetUsd : 25,
    targets,
    mode,
    scheduledFor,
  });
  if (!result.success) return fail(result.error);

  await logAudit(supabase, {
    businessId: ctx.businessId,
    actorUserId: ctx.userId,
    action: "ads.zernio.push_creative",
    targetKind: "ad_campaign",
    targetId: result.data.adCampaignId,
    metadata: { engineRunId, winningAssetId, zernioPostId: result.data.zernioPostId },
  });

  revalidatePath("/dashboard/ads");
  return ok(result.data);
}

function pickString(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
