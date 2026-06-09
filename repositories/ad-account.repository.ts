import type { SupabaseClient } from "@supabase/supabase-js";

export type AdsEnginePlatform = "meta" | "google" | "tiktok" | "microsoft" | "zernio";
export type TrackingPlatform = "ga4" | "meta_pixel" | "gtm";
export type AdPlatform = AdsEnginePlatform | TrackingPlatform;
export type AdAccountStatus = "disconnected" | "pending" | "connected" | "error";

export type AdAccountRow = {
  id: string;
  business_id: string;
  platform: AdPlatform;
  external_account_id: string | null;
  status: AdAccountStatus;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  scopes: string[];
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type AdCampaignStatus =
  | "draft" | "pending" | "active" | "paused" | "archived" | "error";

export type AdCampaignRow = {
  id: string;
  business_id: string;
  ad_account_id: string | null;
  engine_run_id: string | null;
  winning_asset_id: string | null;
  platform: AdPlatform;
  external_campaign_id: string | null;
  name: string;
  status: AdCampaignStatus;
  daily_budget_usd: number;
  spend_usd: number;
  impressions: number;
  clicks: number;
  leads: number;
  last_synced_at: string | null;
  detail: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export function createAdAccountRepository(client: SupabaseClient) {
  return {
    async listByBusiness(businessId: string) {
      return client
        .from("ad_accounts")
        .select("*")
        .eq("business_id", businessId)
        .order("platform", { ascending: true });
    },

    async getByPlatform(businessId: string, platform: AdPlatform) {
      return client
        .from("ad_accounts")
        .select("*")
        .eq("business_id", businessId)
        .eq("platform", platform)
        .maybeSingle();
    },

    async upsert(input: {
      businessId: string;
      platform: AdPlatform;
      externalAccountId?: string | null;
      accountName?: string | null;
      status?: AdAccountStatus;
      accessToken?: string | null;
      refreshToken?: string | null;
      tokenExpiresAt?: string | null;
      scopes?: string[];
      meta?: Record<string, unknown>;
    }) {
      const row: Record<string, unknown> = {
        business_id: input.businessId,
        platform: input.platform,
      };
      if (input.externalAccountId !== undefined) row.external_account_id = input.externalAccountId;
      if (input.accountName !== undefined) row.account_name = input.accountName;
      if (input.status !== undefined) row.status = input.status;
      if (input.accessToken !== undefined) row.access_token = input.accessToken;
      if (input.refreshToken !== undefined) row.refresh_token = input.refreshToken;
      if (input.tokenExpiresAt !== undefined) row.token_expires_at = input.tokenExpiresAt;
      if (input.scopes !== undefined) row.scopes = input.scopes;
      if (input.meta !== undefined) row.meta = input.meta;

      return client
        .from("ad_accounts")
        .upsert(row, { onConflict: "business_id,platform" })
        .select("*")
        .single();
    },

    async disconnect(businessId: string, platform: AdPlatform) {
      return client
        .from("ad_accounts")
        .update({
          status: "disconnected",
          access_token: null,
          refresh_token: null,
          token_expires_at: null,
        })
        .eq("business_id", businessId)
        .eq("platform", platform)
        .select("*")
        .single();
    },
  };
}

export function createAdCampaignRepository(client: SupabaseClient) {
  return {
    async listByBusiness(businessId: string, limit = 50) {
      return client
        .from("ad_campaigns")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(limit);
    },

    async insert(input: {
      businessId: string;
      adAccountId?: string | null;
      engineRunId?: string | null;
      winningAssetId?: string | null;
      platform: AdPlatform;
      name: string;
      status?: AdCampaignStatus;
      dailyBudgetUsd?: number;
      detail?: Record<string, unknown>;
    }) {
      return client
        .from("ad_campaigns")
        .insert({
          business_id: input.businessId,
          ad_account_id: input.adAccountId ?? null,
          engine_run_id: input.engineRunId ?? null,
          winning_asset_id: input.winningAssetId ?? null,
          platform: input.platform,
          name: input.name,
          status: input.status ?? "draft",
          daily_budget_usd: input.dailyBudgetUsd ?? 0,
          detail: input.detail ?? {},
        })
        .select("*")
        .single();
    },

    async updateMetrics(
      id: string,
      input: {
        spendUsd?: number;
        impressions?: number;
        clicks?: number;
        leads?: number;
        externalCampaignId?: string | null;
        status?: AdCampaignStatus;
      },
    ) {
      const row: Record<string, unknown> = {
        last_synced_at: new Date().toISOString(),
      };
      if (input.spendUsd !== undefined) row.spend_usd = input.spendUsd;
      if (input.impressions !== undefined) row.impressions = input.impressions;
      if (input.clicks !== undefined) row.clicks = input.clicks;
      if (input.leads !== undefined) row.leads = input.leads;
      if (input.externalCampaignId !== undefined) row.external_campaign_id = input.externalCampaignId;
      if (input.status !== undefined) row.status = input.status;

      return client.from("ad_campaigns").update(row).eq("id", id).select("*").single();
    },

    async aggregateRollupForBusiness(businessId: string) {
      return client
        .from("ad_campaigns")
        .select("spend_usd, impressions, clicks, leads, status")
        .eq("business_id", businessId);
    },
  };
}
