import type { AdAccountConnectionRow } from "@/lib/integrations/ad-account-connection";
import { GROWTH_INTEGRATION_IDS } from "@/lib/integrations/growth-integrations-catalog";
import type { AdPlatform } from "@/types/marketing-os";

export type LinkedAdAccount = {
  id: string;
  accountName: string | null;
  credentialsHint: string | null;
};

/** Maps growth hub integration id → ad_accounts.platform for encrypted vault storage. */
const INTEGRATION_TO_AD_PLATFORM: Partial<Record<string, AdPlatform>> = {
  meta: "meta",
  google_ads: "google",
  zernio: "zernio",
  tiktok_ads: "tiktok",
  microsoft_ads: "microsoft",
  linkedin_ads: "other",
  openai_ads: "other",
};

const CREDENTIAL_LABELS: Partial<Record<string, string>> = {
  meta: "Access token",
  google_ads: "OAuth refresh token or API credential",
  zernio: "Zernio API key (sk_…)",
  openai_ads: "OpenAI Ads API key",
  sendgrid: "SendGrid API key",
  stripe: "Stripe secret key",
  hubspot: "Private app token",
};

export function resolveAdPlatform(integrationId: string): AdPlatform {
  return INTEGRATION_TO_AD_PLATFORM[integrationId] ?? "other";
}

export function credentialLabelFor(integrationId: string, integrationName: string): string {
  return CREDENTIAL_LABELS[integrationId] ?? `${integrationName} API key or token`;
}

/** Integrations that support platform OAuth (Meta / Google Ads) from the hub */
export const OAUTH_INTEGRATION_IDS = new Set(["meta", "google_ads"]);

export function integrationOAuthPlatform(
  integrationId: string,
): "meta" | "google" | null {
  if (integrationId === "meta") return "meta";
  if (integrationId === "google_ads") return "google";
  return null;
}

/** Legacy rows keyed by platform enum instead of external_account_id = integration id. */
export const LEGACY_PLATFORM_TO_INTEGRATION: Record<string, string> = {
  meta: "meta",
  google: "google_ads",
  zernio: "zernio",
  tiktok: "tiktok_ads",
  microsoft: "microsoft_ads",
};

export function resolveLinkedIntegrationId(account: AdAccountConnectionRow): string | null {
  const ext = account.external_account_id?.trim();
  if (ext && GROWTH_INTEGRATION_IDS.has(ext)) return ext;

  const platform = String(account.platform).toLowerCase();
  return LEGACY_PLATFORM_TO_INTEGRATION[platform] ?? null;
}

export function isAdAccountConnected(account: AdAccountConnectionRow): boolean {
  const vaultStatus = account.connection_status?.toLowerCase();
  if (vaultStatus === "connected" || vaultStatus === "active") return true;

  const oauthStatus = account.status?.toLowerCase();
  return oauthStatus === "connected" || oauthStatus === "pending";
}
