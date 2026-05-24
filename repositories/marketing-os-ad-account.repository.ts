import type { SupabaseClient } from "@supabase/supabase-js";

import type { AdPlatform, ConnectionStatus } from "@/types/marketing-os";

/** Marketing OS ad account storage (encrypted credentials). Separate from engine `ad_accounts` OAuth table. */
export function createMarketingOsAdAccountRepository(client: SupabaseClient) {
  return {
    async listByBusiness(businessId: string) {
      return client
        .from("ad_accounts")
        .select(
          "id, business_id, platform, account_name, external_account_id, connection_status, credentials_hint, metadata, last_sync_at, campaign_count, total_spend, total_leads, created_at, updated_at",
        )
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
    },

    async getById(id: string) {
      return client.from("ad_accounts").select("*").eq("id", id).maybeSingle();
    },

    async upsert(input: {
      businessId: string;
      platform: AdPlatform;
      accountName?: string | null;
      externalAccountId?: string | null;
      connectionStatus: ConnectionStatus;
      credentialsEncrypted?: string | null;
      credentialsHint?: string | null;
      metadata?: Record<string, unknown>;
    }) {
      const row = {
        business_id: input.businessId,
        platform: input.platform,
        account_name: input.accountName ?? null,
        external_account_id: input.externalAccountId ?? null,
        connection_status: input.connectionStatus,
        credentials_encrypted: input.credentialsEncrypted ?? null,
        credentials_hint: input.credentialsHint ?? null,
        metadata: input.metadata ?? {},
        updated_at: new Date().toISOString(),
      };

      if (input.externalAccountId) {
        const { data: existing } = await client
          .from("ad_accounts")
          .select("id")
          .eq("business_id", input.businessId)
          .eq("platform", input.platform)
          .eq("external_account_id", input.externalAccountId)
          .maybeSingle();

        if (existing?.id) {
          return client.from("ad_accounts").update(row).eq("id", existing.id).select("*").single();
        }
      }

      return client.from("ad_accounts").insert(row).select("*").single();
    },

    async updateSyncStats(
      id: string,
      stats: {
        connectionStatus?: ConnectionStatus;
        campaignCount?: number;
        totalSpend?: number;
        totalLeads?: number;
        metadata?: Record<string, unknown>;
      },
    ) {
      const row: Record<string, unknown> = {
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (stats.connectionStatus) row.connection_status = stats.connectionStatus;
      if (stats.campaignCount !== undefined) row.campaign_count = stats.campaignCount;
      if (stats.totalSpend !== undefined) row.total_spend = stats.totalSpend;
      if (stats.totalLeads !== undefined) row.total_leads = stats.totalLeads;
      if (stats.metadata) row.metadata = stats.metadata;

      return client.from("ad_accounts").update(row).eq("id", id).select("*").single();
    },

    async delete(id: string, businessId: string) {
      return client.from("ad_accounts").delete().eq("id", id).eq("business_id", businessId);
    },
  };
}
