import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getTrackingConnectSpec,
  validateTrackingValue,
} from "@/lib/integrations/tracking-connect";
import { maskCredential } from "@/lib/crypto/credentials";
import { fail, ok, type ServiceResult } from "@/lib/result";
import {
  createAdAccountRepository,
  type TrackingPlatform,
} from "@/repositories/ad-account.repository";
import { createBusinessRepository } from "@/repositories/business.repository";

export async function connectTrackingIntegration(
  client: SupabaseClient,
  ownerUserId: string,
  businessId: string,
  integrationId: string,
  value: string,
  accountName?: string,
): Promise<ServiceResult<{ id: string }>> {
  const spec = getTrackingConnectSpec(integrationId);
  if (!spec) return fail("Unsupported tracking integration.");

  const validation = validateTrackingValue(integrationId, value);
  if (!validation.ok) return fail(validation.error);

  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(businessId);
  if (!business || business.user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  const trimmed = value.trim();
  const repo = createAdAccountRepository(client);
  const meta: Record<string, unknown> = {
    [spec.metaKey]: trimmed,
    accountLabel: accountName ?? spec.platform,
    connectedAt: new Date().toISOString(),
  };

  const { data, error } = await repo.upsert({
    businessId,
    platform: spec.platform as TrackingPlatform,
    externalAccountId: integrationId,
    status: "connected",
    accessToken: trimmed,
    meta,
  });

  if (error || !data) return fail(error?.message ?? "Failed to save tracking connection.");

  await syncTrackingToLandingPages(client, businessId, integrationId, trimmed);

  return ok({ id: data.id as string });
}

async function syncTrackingToLandingPages(
  client: SupabaseClient,
  businessId: string,
  integrationId: string,
  value: string,
) {
  const { data: pages } = await client
    .from("landing_pages")
    .select("id, config")
    .eq("business_id", businessId);

  if (!pages?.length) return;

  for (const page of pages) {
    const config = (page.config ?? {}) as Record<string, unknown>;
    const pixels = { ...((config.pixels ?? {}) as Record<string, string>) };

    if (integrationId === "ga4") {
      pixels.googleConversionId = value;
    } else if (integrationId === "meta_pixel") {
      pixels.metaPixelId = value;
    } else if (integrationId === "gtm") {
      pixels.gtmContainerId = value;
    }

    const next = { ...config, pixels };
    await client.from("landing_pages").update({ config: next }).eq("id", page.id);
  }
}

export async function loadBusinessTrackingPixels(
  client: SupabaseClient,
  businessId: string,
): Promise<{ metaPixelId?: string; googleConversionId?: string; gtmContainerId?: string }> {
  const { data } = await client
    .from("ad_accounts")
    .select("platform, meta, access_token, status")
    .eq("business_id", businessId)
    .in("platform", ["ga4", "meta_pixel", "gtm"]);

  const out: { metaPixelId?: string; googleConversionId?: string; gtmContainerId?: string } = {};
  for (const row of data ?? []) {
    if (row.status !== "connected") continue;
    const meta = (row.meta ?? {}) as Record<string, unknown>;
    const token = typeof row.access_token === "string" ? row.access_token : null;
    if (row.platform === "ga4") {
      const id =
        (typeof meta.measurementId === "string" && meta.measurementId) || token || undefined;
      if (id) out.googleConversionId = id;
    } else if (row.platform === "meta_pixel") {
      const id = (typeof meta.pixelId === "string" && meta.pixelId) || token || undefined;
      if (id) out.metaPixelId = id;
    } else if (row.platform === "gtm") {
      const id =
        (typeof meta.containerId === "string" && meta.containerId) || token || undefined;
      if (id) out.gtmContainerId = id;
    }
  }
  return out;
}

export function trackingCredentialsHint(
  integrationId: string,
  meta: Record<string, unknown>,
  accessToken: string | null,
): string {
  const raw =
    (typeof meta.measurementId === "string" && meta.measurementId) ||
    (typeof meta.pixelId === "string" && meta.pixelId) ||
    (typeof meta.containerId === "string" && meta.containerId) ||
    accessToken ||
    "";
  return raw ? maskCredential(raw) : "Connected";
}
