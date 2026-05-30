import { GROWTH_INTEGRATION_IDS } from "@/lib/integrations/growth-integrations-catalog";
import type { AdPlatform } from "@/types/marketing-os";

export type LinkedAdAccount = {
  id: string;
  accountName: string | null;
  credentialsHint: string | null;
};

export type AdsOAuthConfigured = {
  meta: boolean;
  google: boolean;
};

/** Maps growth hub integration id → ad_accounts.platform for encrypted vault storage. */
const INTEGRATION_TO_AD_PLATFORM: Partial<Record<string, AdPlatform>> = {
  meta: "meta",
  google_ads: "google",
  tiktok_ads: "tiktok",
  microsoft_ads: "microsoft",
  linkedin_ads: "other",
  openai_ads: "other",
};

const CREDENTIAL_LABELS: Partial<Record<string, string>> = {
  meta: "Access token",
  google_ads: "OAuth refresh token or API credential",
  openai_ads: "OpenAI Ads API key",
  sendgrid: "SendGrid API key",
  stripe: "Stripe secret key",
  hubspot: "Private app token",
};

export function resolveAdPlatform(integrationId: string): AdPlatform {
  return INTEGRATION_TO_AD_PLATFORM[integrationId] ?? "other";
}

/** Integrations that use the shared ads OAuth flow (Campaign Ops + hub). */
const OAUTH_ADS_PLATFORM_BY_INTEGRATION: Partial<Record<string, "meta" | "google">> = {
  meta: "meta",
  google_ads: "google",
};

export function resolveOAuthAdsPlatform(integrationId: string): "meta" | "google" | null {
  return OAUTH_ADS_PLATFORM_BY_INTEGRATION[integrationId] ?? null;
}

export function credentialLabelFor(integrationId: string, integrationName: string): string {
  return CREDENTIAL_LABELS[integrationId] ?? `${integrationName} API key or token`;
}

/** Legacy rows keyed by platform enum instead of external_account_id = integration id. */
export const LEGACY_PLATFORM_TO_INTEGRATION: Record<string, string> = {
  meta: "meta",
  google: "google_ads",
  tiktok: "tiktok_ads",
  microsoft: "microsoft_ads",
};

type AdAccountRow = {
  platform: string;
  external_account_id: string | null;
  connection_status?: string | null;
};

export function resolveLinkedIntegrationId(account: AdAccountRow): string | null {
  const ext = account.external_account_id?.trim();
  if (ext && GROWTH_INTEGRATION_IDS.has(ext)) return ext;

  const platform = String(account.platform).toLowerCase();
  return LEGACY_PLATFORM_TO_INTEGRATION[platform] ?? null;
}

export function isAdAccountConnected(account: AdAccountRow): boolean {
  const status = account.connection_status?.toLowerCase();
  return status === "connected" || status === "active";
}
