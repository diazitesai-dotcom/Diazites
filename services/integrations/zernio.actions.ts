"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/log";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";
import {
  listZernioAccountsForUi,
  listZernioAdCampaigns,
  publishZernioPost,
  testZernioConnection,
} from "@/services/integrations/zernio.service";

export async function testZernioConnectionAction() {
  const result = await testZernioConnection();
  if (!result.success) {
    return { success: false as const, error: result.error };
  }
  return { success: true as const, data: result.data };
}

export async function listZernioCampaignsAction() {
  const result = await listZernioAdCampaigns();
  if (!result.success) {
    return { success: false as const, error: result.error };
  }
  return { success: true as const, data: result.data };
}

export async function listZernioAccountsAction() {
  const result = await listZernioAccountsForUi();
  if (!result.success) {
    return { success: false as const, error: result.error };
  }
  return { success: true as const, data: result.data };
}

export async function publishZernioPostAction(formData: FormData) {
  await requireAuth();
  const supabase = await createServerSupabaseClient();

  const content = String(formData.get("content") ?? "").trim();
  const mode = String(formData.get("schedule_mode") ?? "now") as
    | "now"
    | "scheduled"
    | "draft";
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

  const result = await publishZernioPost({
    content,
    targets,
    mode,
    scheduledFor: scheduledFor || undefined,
  });

  if (!result.success) {
    return { success: false as const, error: result.error };
  }

  await logAudit(supabase, {
    action: "zernio.post_published",
    metadata: { postId: result.data.postId, mode },
  });

  revalidatePath("/dashboard/ads");
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

  const { verifyApiKey } = await import("@/lib/zernio");
  try {
    await verifyApiKey(apiKey);
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
    accessToken: apiKey,
    status: "connected",
  });
  if (error) {
    return { success: false as const, error: error.message };
  }

  revalidatePath("/dashboard/ads");
  return { success: true as const };
}
