"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { logAudit } from "@/lib/audit/log";
import { requireAuth } from "@/lib/auth/session";
import { fail, ok, type ServiceResult } from "@/lib/result";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";

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
import {
  syncZernioCampaigns,
  type SyncZernioSummary,
} from "@/services/ads/zernio-sync.service";
import type { ZernioPlatform } from "@/lib/zernio";

async function resolveBusinessId(): Promise<{ businessId: string; userId: string } | null> {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business) return null;
  return { businessId: business.id, userId: user.id };
}

export async function startMetaConnectAction(): Promise<ServiceResult<{ url: string }>> {
  const ctx = await resolveBusinessId();
  if (!ctx) redirect("/onboarding?error=Complete+onboarding+first");

  const link = await buildMetaAuthLink({ businessId: ctx.businessId });
  if (!link.success) return fail(link.error);
  return ok({ url: link.data.url });
}

export async function disconnectMetaAction(): Promise<ServiceResult<{ ok: true }>> {
  const ctx = await resolveBusinessId();
  if (!ctx) return fail("No business found");

  const supabase = await createServerSupabaseClient();
  const result = await disconnectMeta(supabase, { businessId: ctx.businessId });
  if (!result.success) return fail(result.error);

  await logAudit(supabase, {
    businessId: ctx.businessId,
    actorUserId: ctx.userId,
    action: "ads.meta.disconnect",
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
  const name = pickString(formData.get("name")) ?? "Engine campaign (Zernio)";
  const budgetRaw = pickString(formData.get("daily_budget_usd"));
  const dailyBudgetUsd = budgetRaw ? Number(budgetRaw) : 10;
  const mode = (pickString(formData.get("mode")) ?? "now") as
    | "now"
    | "scheduled"
    | "draft";
  const scheduledFor = pickString(formData.get("scheduled_for"));
  const rawTargets = pickString(formData.get("targets"));

  if (!engineRunId || !winningAssetId) {
    return fail("Missing engine run id or winning asset id");
  }

  let targets:
    | Array<{ platform: ZernioPlatform; accountId: string }>
    | undefined;
  if (rawTargets) {
    try {
      const parsed = JSON.parse(rawTargets) as unknown;
      if (Array.isArray(parsed)) {
        targets = parsed
          .filter(
            (t): t is { platform: string; accountId: string } =>
              !!t &&
              typeof t === "object" &&
              typeof (t as { platform?: unknown }).platform === "string" &&
              typeof (t as { accountId?: unknown }).accountId === "string",
          )
          .map((t) => ({
            platform: t.platform as ZernioPlatform,
            accountId: t.accountId,
          }));
      }
    } catch {
      // Ignore bad JSON — falls back to "post to every connected account".
    }
  }

  const supabase = await createServerSupabaseClient();
  const result = await pushZernioCreative(supabase, {
    businessId: ctx.businessId,
    engineRunId,
    winningAssetId,
    name,
    dailyBudgetUsd: Number.isFinite(dailyBudgetUsd) ? dailyBudgetUsd : 10,
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
    metadata: {
      engineRunId,
      winningAssetId,
      mode: result.data.mode,
      targetCount: result.data.targets.length,
      zernioPostId: result.data.zernioPostId,
    },
  });

  revalidatePath("/dashboard/ads");
  return ok(result.data);
}

export async function syncZernioCampaignsAction(): Promise<
  ServiceResult<SyncZernioSummary>
> {
  const ctx = await resolveBusinessId();
  if (!ctx) return fail("No business found");

  const supabase = await createServerSupabaseClient();
  const result = await syncZernioCampaigns(supabase, {
    businessId: ctx.businessId,
  });
  if (!result.success) return fail(result.error);

  await logAudit(supabase, {
    businessId: ctx.businessId,
    actorUserId: ctx.userId,
    action: "ads.zernio.sync_campaigns",
    metadata: { summary: result.data },
  });

  revalidatePath("/dashboard/ads");
  return ok(result.data);
}

function pickString(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
