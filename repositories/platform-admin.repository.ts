import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  PlatformAccountSettingsRow,
  PlatformAccountStatus,
  PlatformAccountType,
  PlatformFeatureFlags,
  UsageLimitOverrides,
} from "@/types/platform-admin";

export function createPlatformAdminRepository(client: SupabaseClient) {
  return {
    async listAllBusinesses() {
      return client
        .from("businesses")
        .select("id, name, user_id, created_at, updated_at")
        .order("created_at", { ascending: false });
    },

    async listUsersByIds(ids: string[]) {
      if (ids.length === 0) return { data: [], error: null };
      return client.from("users").select("id, email, created_at").in("id", ids);
    },

    async listBilling() {
      return client.from("billing").select("*");
    },

    async listAccountSettings() {
      return client.from("platform_account_settings").select("*");
    },

    async getAccountSettings(businessId: string) {
      return client
        .from("platform_account_settings")
        .select("*")
        .eq("business_id", businessId)
        .maybeSingle();
    },

    async upsertAccountSettings(input: {
      businessId: string;
      accountType?: PlatformAccountType;
      status?: PlatformAccountStatus;
      parentBusinessId?: string | null;
      featureFlags?: PlatformFeatureFlags;
      usageLimitOverrides?: UsageLimitOverrides;
      whiteLabelEnabled?: boolean;
      adminNotes?: string | null;
      updatedBy?: string | null;
    }) {
      const row: Record<string, unknown> = {
        business_id: input.businessId,
        updated_at: new Date().toISOString(),
      };
      if (input.accountType != null) row.account_type = input.accountType;
      if (input.status != null) row.status = input.status;
      if (input.parentBusinessId !== undefined) row.parent_business_id = input.parentBusinessId;
      if (input.featureFlags != null) row.feature_flags = input.featureFlags;
      if (input.usageLimitOverrides != null) row.usage_limit_overrides = input.usageLimitOverrides;
      if (input.whiteLabelEnabled != null) row.white_label_enabled = input.whiteLabelEnabled;
      if (input.adminNotes !== undefined) row.admin_notes = input.adminNotes;
      if (input.updatedBy != null) row.updated_by = input.updatedBy;

      return client
        .from("platform_account_settings")
        .upsert(row, { onConflict: "business_id" })
        .select("*")
        .single();
    },

    async listAgencies() {
      return client.from("agencies").select("*");
    },

    async listManagedBusinesses() {
      return client
        .from("agency_managed_businesses")
        .select("*, agencies(id, name, business_id), businesses(id, name)");
    },

    async listMerchantAccounts() {
      return client.from("merchant_accounts").select("business_id, status, processor");
    },

    async listTeamCounts() {
      return client.from("team_members").select("business_id");
    },

    async listUsageForCurrentMonth(periodStart: string, periodEnd: string) {
      return client
        .from("usage_records")
        .select("business_id, metric_key, quantity")
        .gte("period_start", periodStart)
        .lte("period_end", periodEnd);
    },

    async countAiActivitySince(since: string) {
      return client
        .from("agent_activity_logs")
        .select("business_id")
        .gte("created_at", since);
    },

    async listAiActivityForBusiness(businessId: string, limit = 50) {
      return client
        .from("agent_activity_logs")
        .select("id, agent_key, action_type, entity_type, entity_id, payload, created_at")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(limit);
    },

    async logAdminAction(input: {
      actorUserId: string;
      actionType: string;
      businessId?: string | null;
      agencyId?: string | null;
      details?: Record<string, unknown>;
    }) {
      return client.from("platform_admin_audit_logs").insert({
        actor_user_id: input.actorUserId,
        action_type: input.actionType,
        business_id: input.businessId ?? null,
        agency_id: input.agencyId ?? null,
        details: input.details ?? {},
      });
    },

    async createAgencyRow(input: { businessId: string; name: string }) {
      return client
        .from("agencies")
        .upsert(
          {
            business_id: input.businessId,
            name: input.name,
            merchant_services_enabled: false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "business_id" },
        )
        .select("*")
        .single();
    },

    async linkSubAccount(input: {
      agencyId: string;
      businessId: string;
      label?: string;
    }) {
      return client
        .from("agency_managed_businesses")
        .upsert(
          {
            agency_id: input.agencyId,
            business_id: input.businessId,
            label: input.label ?? null,
          },
          { onConflict: "business_id" },
        )
        .select("*")
        .single();
    },

    async updateBillingPlan(
      businessId: string,
      patch: {
        planName?: string;
        subscriptionStatus?: string;
        amount?: number;
      },
    ) {
      return client
        .from("billing")
        .update({
          plan_name: patch.planName,
          subscription_status: patch.subscriptionStatus,
          amount: patch.amount,
          updated_at: new Date().toISOString(),
        })
        .eq("business_id", businessId)
        .select("*")
        .single();
    },
  };
}

export type PlatformAdminRepository = ReturnType<typeof createPlatformAdminRepository>;
