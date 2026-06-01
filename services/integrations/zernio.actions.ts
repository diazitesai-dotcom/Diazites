"use server";

import { revalidatePath } from "next/cache";

import { markIntegrationsConnectedForUser } from "@/lib/integrations/integration-connection-status";
import { persistZernioConnectedPlatforms } from "@/lib/integrations/load-zernio-accounts-for-adops";
import { resolveZernioApiKeyForBusiness } from "@/lib/integrations/resolve-zernio-api-key";
import { requireAuth } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/log";
import { requireBusinessContext } from "@/lib/auth/business-context";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";
import {
  listZernioAccountsForUi,
  listZernioAdCampaigns,
  publishZernioPost,
  testZernioConnection,
} from "@/services/integrations/zernio.service";

async function getBusinessZernioKey() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const ctx = await requireBusinessContext(supabase);
  if (!ctx.ok) return { ok: false as const, error: ctx.error };
  const key = await resolveZernioApiKeyForBusiness(supabase, ctx.ctx.businessId);
  return { ok: true as const, supabase, user, businessId: ctx.ctx.businessId, key };
}

export async function testZernioConnectionAction() {
  const ctx = await getBusinessZernioKey();
  if (!ctx.ok) return { success: false as const, error: ctx.error };
  const result = await testZernioConnection(ctx.key);
  if (!result.success) return { success: false as const, error: result.error };
  return { success: true as const, data: result.data };
}

export async function listZernioCampaignsAction() {
  const ctx = await getBusinessZernioKey();
  if (!ctx.ok) return { success: false as const, error: ctx.error };
  const result = await listZernioAdCampaigns(ctx.key);
  if (!result.success) return { success: false as const, error: result.error };
  return { success: true as const, data: result.data };
}

export async function listZernioAccountsAction() {
  const ctx = await getBusinessZernioKey();
  if (!ctx.ok) return { success: false as const, error: ctx.error };
  const result = await listZernioAccountsForUi(ctx.key);
  if (!result.success) return { success: false as const, error: result.error };

  const platforms = result.data.map((a) => a.platform);
  await persistZernioConnectedPlatforms(
    ctx.supabase,
    ctx.businessId,
    platforms,
    result.data.length,
  );
  revalidatePath("/dashboard/campaign-ops");

  return { success: true as const, data: result.data };
}

export async function publishZernioPostAction(formData: FormData) {
  const ctx = await getBusinessZernioKey();
  if (!ctx.ok) return { success: false as const, error: ctx.error };

  const content = String(formData.get("content") ?? "").trim();
  const mode = String(formData.get("schedule_mode") ?? "now") as "now" | "scheduled" | "draft";
  const targetsRaw = String(formData.get("targets") ?? "[]");
  const scheduledFor = String(formData.get("scheduled_for") ?? "").trim();

  if (!content) {
    return { success: false as const, error: "Content is required." };
  }

  let targets: Array<{ platform: string; accountId: string }> = [];
  try {
    targets = JSON.parse(targetsRaw) as Array<{ platform: string; accountId: string }>;
  } catch {
    return { success: false as const, error: "Invalid targets payload." };
  }

  const result = await publishZernioPost(
    { content, targets, mode, scheduledFor: scheduledFor || undefined },
    ctx.key,
  );

  if (!result.success) {
    return { success: false as const, error: result.error };
  }

  await logAudit(ctx.supabase, {
    action: "zernio.post_published",
    metadata: { postId: result.data.postId, mode },
  });

  revalidatePath("/dashboard/integrations");
  revalidatePath("/dashboard/campaign-ops");
  return { success: true as const, data: result.data };
}

export async function connectZernioWithApiKeyAction(formData: FormData) {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business) {
    return { success: false as const, error: "Complete onboarding first." };
  }

  const apiKey = String(formData.get("api_key") ?? "").trim();
  if (!apiKey) {
    return { success: false as const, error: "API key is required." };
  }

  const { verifyApiKey, listAccounts } = await import("@/lib/zernio");
  let accountCount = 0;
  let connectedPlatforms: string[] = [];
  try {
    const verified = await verifyApiKey(apiKey);
    accountCount = verified.accountCount;
    const accounts = await listAccounts(apiKey);
    accountCount = Math.max(accountCount, accounts.length);
    connectedPlatforms = accounts.map((a) => a.platform);
  } catch (e) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Invalid API key",
    };
  }

  const { createAdAccountRepository } = await import("@/repositories/ad-account.repository");
  const accounts = createAdAccountRepository(supabase);
  const { error } = await accounts.upsert({
    businessId: business.id,
    platform: "zernio",
    externalAccountId: "zernio",
    accountName: "Zernio",
    accessToken: apiKey,
    status: "connected",
    meta: {
      accountLabel: "Zernio",
      connectedAppCount: accountCount,
      connectedPlatforms,
      lastVerifiedAt: new Date().toISOString(),
      lastSyncedAt: new Date().toISOString(),
    },
  });
  if (error) {
    return { success: false as const, error: error.message };
  }

  await markIntegrationsConnectedForUser(supabase, user.id);
  await persistZernioConnectedPlatforms(
    supabase,
    business.id,
    connectedPlatforms,
    accountCount,
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/integrations");
  revalidatePath("/dashboard/campaign-ops");
  return { success: true as const, data: { accountCount } };
}

export async function disconnectZernioAction() {
  const ctx = await getBusinessZernioKey();
  if (!ctx.ok) return { success: false as const, error: ctx.error };

  const { createAdAccountRepository } = await import("@/repositories/ad-account.repository");
  const accounts = createAdAccountRepository(ctx.supabase);
  const { data: row } = await accounts.getByPlatform(ctx.businessId, "zernio");
  if (!row) {
    return { success: true as const };
  }

  const { error } = await ctx.supabase.from("ad_accounts").delete().eq("id", row.id);
  if (error) return { success: false as const, error: error.message };

  revalidatePath("/dashboard/integrations");
  revalidatePath("/dashboard/campaign-ops");
  return { success: true as const };
}
