"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { logAudit } from "@/lib/audit/log";
import { requireAuth } from "@/lib/auth/session";
import { fail, ok, type ServiceResult } from "@/lib/result";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";

import {
  connectZernio,
  disconnectZernio,
  getZernioConnection,
  publishZernioPost,
  type ZernioConnectionSummary,
} from "@/services/integrations/zernio.service";
import type { ZernioCreatePostInput, ZernioPlatform } from "@/lib/zernio";

const ALLOWED_PLATFORMS = new Set<ZernioPlatform>([
  "twitter",
  "instagram",
  "facebook",
  "linkedin",
  "tiktok",
  "youtube",
  "pinterest",
  "reddit",
  "bluesky",
  "threads",
  "googlebusiness",
  "telegram",
  "snapchat",
  "whatsapp",
  "discord",
]);

export async function connectZernioAction(
  formData: FormData,
): Promise<ServiceResult<{ accountCount: number }>> {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business) redirect("/onboarding?error=Complete+onboarding+first");

  const apiKey = pickString(formData.get("api_key"));
  if (!apiKey) return fail("API key is required");

  const result = await connectZernio(supabase, {
    businessId: business.id,
    userId: user.id,
    apiKey,
  });
  if (!result.success) return fail(result.error);

  await logAudit(supabase, {
    actorUserId: user.id,
    businessId: business.id,
    action: "zernio.connect",
    targetKind: "ad_account",
    metadata: { accountCount: result.data.accountCount },
  });

  revalidatePath("/dashboard/ads");
  return ok(result.data);
}

export async function disconnectZernioAction(): Promise<
  ServiceResult<{ ok: true }>
> {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business) redirect("/onboarding?error=Complete+onboarding+first");

  const result = await disconnectZernio(supabase, {
    businessId: business.id,
    userId: user.id,
  });
  if (!result.success) return fail(result.error);

  await logAudit(supabase, {
    actorUserId: user.id,
    businessId: business.id,
    action: "zernio.disconnect",
    targetKind: "ad_account",
  });

  revalidatePath("/dashboard/ads");
  return ok(result.data);
}

export async function refreshZernioConnectionAction(): Promise<
  ServiceResult<ZernioConnectionSummary>
> {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business) redirect("/onboarding?error=Complete+onboarding+first");

  const result = await getZernioConnection(supabase, { businessId: business.id });
  if (!result.success) return fail(result.error);

  revalidatePath("/dashboard/ads");
  return ok(result.data);
}

/**
 * Publish or schedule a post via the user's Zernio account. The connector
 * UI passes pre-resolved {platform, accountId} pairs in a JSON-encoded
 * `targets` field — that's the canonical Zernio shape, and we forward it
 * unchanged after validating the platform values.
 */
export async function publishZernioPostAction(
  formData: FormData,
): Promise<ServiceResult<{ postId: string }>> {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business) redirect("/onboarding?error=Complete+onboarding+first");

  const content = pickString(formData.get("content"));
  if (!content) return fail("Post content is required");

  const rawTargets = pickString(formData.get("targets"));
  if (!rawTargets) return fail("Pick at least one target account to post to");

  let parsedTargets: Array<{ platform: string; accountId: string }>;
  try {
    parsedTargets = JSON.parse(rawTargets);
  } catch {
    return fail("Could not parse target accounts payload");
  }
  if (!Array.isArray(parsedTargets) || parsedTargets.length === 0) {
    return fail("Pick at least one target account to post to");
  }

  const targets: ZernioCreatePostInput["platforms"] = [];
  for (const t of parsedTargets) {
    if (!t || typeof t !== "object") continue;
    const platform = String(t.platform ?? "") as ZernioPlatform;
    const accountId = String(t.accountId ?? "");
    if (!ALLOWED_PLATFORMS.has(platform) || !accountId) continue;
    targets.push({ platform, accountId });
  }
  if (targets.length === 0) return fail("No valid target accounts in selection");

  const scheduleMode = pickString(formData.get("schedule_mode")) ?? "now";
  const scheduledFor = pickString(formData.get("scheduled_for"));
  const timezone = pickString(formData.get("timezone")) ?? "UTC";

  const input: ZernioCreatePostInput = {
    content,
    platforms: targets,
    timezone,
  };
  if (scheduleMode === "now") {
    input.publishNow = true;
  } else if (scheduleMode === "draft") {
    input.isDraft = true;
  } else if (scheduleMode === "scheduled" && scheduledFor) {
    input.scheduledFor = scheduledFor;
  }

  const result = await publishZernioPost(supabase, {
    businessId: business.id,
    userId: user.id,
    input,
  });
  if (!result.success) return fail(result.error);

  await logAudit(supabase, {
    actorUserId: user.id,
    businessId: business.id,
    action: "zernio.post",
    targetKind: "zernio_post",
    targetId: result.data._id,
    metadata: {
      mode: scheduleMode,
      platforms: targets.map((t) => t.platform),
      contentPreview: content.slice(0, 120),
    },
  });

  revalidatePath("/dashboard/ads");
  return ok({ postId: result.data._id });
}

function pickString(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
