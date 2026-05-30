import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  AgencyManagedBusinessRow,
  AgencyRow,
  MerchantAccountRow,
  MerchantActivationRequestRow,
  MerchantAdminOverview,
  MerchantDashboardStats,
  MerchantDisputeRow,
  MerchantFeeConfigRow,
  MerchantInvoiceRow,
  MerchantPaymentLinkRow,
  MerchantPayoutRow,
  MerchantRefundRow,
  MerchantSubscriptionRow,
  MerchantTransactionRow,
  PaymentProcessor,
  MerchantConnectionType,
  MerchantAccountStatus,
} from "@/types/merchant-services";

export function createMerchantRepository(client: SupabaseClient) {
  return {
    // --- Agencies ---
    async listAgencies() {
      return client.from("agencies").select("*").order("created_at", { ascending: false });
    },

    async getAgencyByBusinessId(businessId: string) {
      return client.from("agencies").select("*").eq("business_id", businessId).maybeSingle();
    },

    async upsertAgency(input: {
      businessId: string;
      name: string;
      merchantServicesEnabled?: boolean;
    }) {
      return client
        .from("agencies")
        .upsert(
          {
            business_id: input.businessId,
            name: input.name,
            merchant_services_enabled: input.merchantServicesEnabled ?? false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "business_id" },
        )
        .select("*")
        .single();
    },

    async updateAgencyMerchantSettings(
      agencyId: string,
      settings: Partial<
        Pick<
          AgencyRow,
          | "merchant_services_enabled"
          | "allowed_processors"
          | "stripe_required"
          | "external_processors_allowed"
          | "platform_fees_enabled"
          | "merchant_included_in_plan"
          | "merchant_addon_price"
        >
      >,
    ) {
      return client
        .from("agencies")
        .update({ ...settings, updated_at: new Date().toISOString() })
        .eq("id", agencyId)
        .select("*")
        .single();
    },

    async listManagedBusinesses(agencyId: string) {
      return client
        .from("agency_managed_businesses")
        .select("*, businesses:business_id(id, name, user_id)")
        .eq("agency_id", agencyId)
        .order("created_at", { ascending: false });
    },

    async listAllManagedBusinesses() {
      return client
        .from("agency_managed_businesses")
        .select("*, agencies:agency_id(id, name, business_id), businesses:business_id(id, name)")
        .order("created_at", { ascending: false });
    },

    async linkManagedBusiness(input: {
      agencyId: string;
      businessId: string;
      label?: string;
      merchantServicesEnabled?: boolean;
    }) {
      return client
        .from("agency_managed_businesses")
        .upsert(
          {
            agency_id: input.agencyId,
            business_id: input.businessId,
            label: input.label ?? null,
            merchant_services_enabled: input.merchantServicesEnabled ?? false,
          },
          { onConflict: "business_id" },
        )
        .select("*")
        .single();
    },

    // --- Merchant accounts ---
    async getMerchantAccount(businessId: string) {
      return client
        .from("merchant_accounts")
        .select("*")
        .eq("business_id", businessId)
        .maybeSingle();
    },

    async listMerchantAccounts(status?: MerchantAccountStatus) {
      let q = client.from("merchant_accounts").select("*, businesses:business_id(id, name)");
      if (status) q = q.eq("status", status);
      return q.order("updated_at", { ascending: false });
    },

    async upsertMerchantAccount(input: {
      businessId: string;
      agencyId?: string | null;
      processor?: PaymentProcessor;
      connectionType?: MerchantConnectionType;
      status?: MerchantAccountStatus;
      processorAccountId?: string | null;
      onboardingComplete?: boolean;
      approvedBy?: string | null;
    }) {
      const now = new Date().toISOString();
      return client
        .from("merchant_accounts")
        .upsert(
          {
            business_id: input.businessId,
            agency_id: input.agencyId ?? null,
            processor: input.processor ?? "stripe",
            connection_type: input.connectionType ?? "stripe_connect",
            status: input.status ?? "pending",
            processor_account_id: input.processorAccountId ?? null,
            onboarding_complete: input.onboardingComplete ?? false,
            approved_by: input.approvedBy ?? null,
            activated_at: input.status === "active" ? now : undefined,
            updated_at: now,
          },
          { onConflict: "business_id" },
        )
        .select("*")
        .single();
    },

    async updateMerchantAccountStatus(
      businessId: string,
      status: MerchantAccountStatus,
      extra?: Partial<MerchantAccountRow>,
    ) {
      const patch: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
        ...extra,
      };
      if (status === "active") patch.activated_at = new Date().toISOString();
      if (status === "deactivated") patch.deactivated_at = new Date().toISOString();
      return client
        .from("merchant_accounts")
        .update(patch)
        .eq("business_id", businessId)
        .select("*")
        .single();
    },

    // --- Activation requests ---
    async createActivationRequest(input: {
      businessId: string;
      agencyId?: string | null;
      requestedBy?: string | null;
      processor?: PaymentProcessor;
      connectionType?: MerchantConnectionType;
      notes?: string;
    }) {
      return client
        .from("merchant_activation_requests")
        .insert({
          business_id: input.businessId,
          agency_id: input.agencyId ?? null,
          requested_by: input.requestedBy ?? null,
          processor: input.processor ?? "stripe",
          connection_type: input.connectionType ?? "stripe_connect",
          notes: input.notes ?? null,
        })
        .select("*")
        .single();
    },

    async listActivationRequests(status?: string) {
      let q = client
        .from("merchant_activation_requests")
        .select("*, businesses:business_id(id, name)");
      if (status) q = q.eq("status", status);
      return q.order("created_at", { ascending: false });
    },

    async reviewActivationRequest(
      requestId: string,
      status: "approved" | "denied",
      reviewedBy: string,
      notes?: string,
    ) {
      return client
        .from("merchant_activation_requests")
        .update({
          status,
          reviewed_by: reviewedBy,
          reviewed_at: new Date().toISOString(),
          notes: notes ?? null,
        })
        .eq("id", requestId)
        .select("*")
        .single();
    },

    // --- Fee config ---
    async getFeeConfigForBusiness(businessId: string) {
      const { data: specific } = await client
        .from("merchant_fee_configs")
        .select("*")
        .eq("business_id", businessId)
        .maybeSingle();
      if (specific) return { data: specific as MerchantFeeConfigRow, error: null };

      const { data: managed } = await client
        .from("agency_managed_businesses")
        .select("agency_id")
        .eq("business_id", businessId)
        .maybeSingle();
      if (managed?.agency_id) {
        const { data: agencyFee } = await client
          .from("merchant_fee_configs")
          .select("*")
          .eq("agency_id", managed.agency_id)
          .maybeSingle();
        if (agencyFee) return { data: agencyFee as MerchantFeeConfigRow, error: null };
      }

      return client
        .from("merchant_fee_configs")
        .select("*")
        .eq("is_global_default", true)
        .maybeSingle();
    },

    async upsertFeeConfig(input: {
      businessId?: string | null;
      agencyId?: string | null;
      isGlobalDefault?: boolean;
      platformFeePercent?: number;
      platformFeeFlat?: number;
      agencyRevenueSharePercent?: number;
      subAccountMarkupPercent?: number;
      payoutDelayDays?: number;
    }) {
      const row: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (input.businessId !== undefined) row.business_id = input.businessId;
      if (input.agencyId !== undefined) row.agency_id = input.agencyId;
      if (input.isGlobalDefault != null) row.is_global_default = input.isGlobalDefault;
      if (input.platformFeePercent != null) row.platform_fee_percent = input.platformFeePercent;
      if (input.platformFeeFlat != null) row.platform_fee_flat = input.platformFeeFlat;
      if (input.agencyRevenueSharePercent != null)
        row.agency_revenue_share_percent = input.agencyRevenueSharePercent;
      if (input.subAccountMarkupPercent != null)
        row.sub_account_markup_percent = input.subAccountMarkupPercent;
      if (input.payoutDelayDays != null) row.payout_delay_days = input.payoutDelayDays;

      if (input.isGlobalDefault) {
        const { data: existing } = await client
          .from("merchant_fee_configs")
          .select("id")
          .eq("is_global_default", true)
          .maybeSingle();
        if (existing) {
          return client
            .from("merchant_fee_configs")
            .update(row)
            .eq("id", existing.id)
            .select("*")
            .single();
        }
      }

      return client.from("merchant_fee_configs").insert(row).select("*").single();
    },

    async getGlobalFeeConfig() {
      return client
        .from("merchant_fee_configs")
        .select("*")
        .eq("is_global_default", true)
        .maybeSingle();
    },

    // --- Transactions & related ---
    async insertTransaction(row: Partial<MerchantTransactionRow> & { business_id: string; amount: number }) {
      return client.from("merchant_transactions").insert(row).select("*").single();
    },

    async listTransactions(businessId: string, limit = 50) {
      return client
        .from("merchant_transactions")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(limit);
    },

    async upsertTransactionByProcessorId(input: {
      businessId: string;
      processor: PaymentProcessor;
      processorTransactionId: string;
      patch: Partial<MerchantTransactionRow>;
    }) {
      const { data: existing } = await client
        .from("merchant_transactions")
        .select("id")
        .eq("processor", input.processor)
        .eq("processor_transaction_id", input.processorTransactionId)
        .maybeSingle();

      if (existing) {
        return client
          .from("merchant_transactions")
          .update({ ...input.patch, updated_at: new Date().toISOString() })
          .eq("id", existing.id)
          .select("*")
          .single();
      }
      return client
        .from("merchant_transactions")
        .insert({
          business_id: input.businessId,
          processor: input.processor,
          processor_transaction_id: input.processorTransactionId,
          amount: input.patch.amount ?? 0,
          ...input.patch,
        })
        .select("*")
        .single();
    },

    async listInvoices(businessId: string) {
      return client
        .from("merchant_invoices")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
    },

    async insertInvoice(row: Partial<MerchantInvoiceRow> & { business_id: string }) {
      return client.from("merchant_invoices").insert(row).select("*").single();
    },

    async listPaymentLinks(businessId: string) {
      return client
        .from("merchant_payment_links")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
    },

    async insertPaymentLink(row: Partial<MerchantPaymentLinkRow> & { business_id: string; name: string }) {
      return client.from("merchant_payment_links").insert(row).select("*").single();
    },

    async listSubscriptions(businessId: string) {
      return client
        .from("merchant_subscriptions")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
    },

    async insertSubscription(row: Partial<MerchantSubscriptionRow> & { business_id: string }) {
      return client.from("merchant_subscriptions").insert(row).select("*").single();
    },

    async listRefunds(businessId: string) {
      return client
        .from("merchant_refunds")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
    },

    async insertRefund(row: Partial<MerchantRefundRow> & { business_id: string; amount: number }) {
      return client.from("merchant_refunds").insert(row).select("*").single();
    },

    async listDisputes(businessId: string) {
      return client
        .from("merchant_disputes")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
    },

    async listPayouts(businessId: string) {
      return client
        .from("merchant_payouts")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
    },

    async insertPayout(row: Partial<MerchantPayoutRow> & { business_id: string; amount: number }) {
      return client.from("merchant_payouts").insert(row).select("*").single();
    },

    async logAudit(input: {
      businessId?: string | null;
      agencyId?: string | null;
      actorUserId?: string | null;
      actionType: string;
      entityType?: string;
      entityId?: string;
      details?: Record<string, unknown>;
    }) {
      return client.from("merchant_audit_logs").insert({
        business_id: input.businessId ?? null,
        agency_id: input.agencyId ?? null,
        actor_user_id: input.actorUserId ?? null,
        action_type: input.actionType,
        entity_type: input.entityType ?? null,
        entity_id: input.entityId ?? null,
        details: input.details ?? {},
      });
    },

    async dashboardStats(businessId: string): Promise<MerchantDashboardStats> {
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const { data: txs } = await client
        .from("merchant_transactions")
        .select("amount, status, platform_fee, transaction_type")
        .eq("business_id", businessId)
        .gte("created_at", since);

      const rows = txs ?? [];
      const succeeded = rows.filter((r) => r.status === "succeeded");
      return {
        volume30d: succeeded.reduce((s, r) => s + Number(r.amount), 0),
        platformRevenue30d: succeeded.reduce((s, r) => s + Number(r.platform_fee ?? 0), 0),
        failedCount30d: rows.filter((r) => r.status === "failed").length,
        refundCount30d: rows.filter((r) => r.transaction_type === "refund").length,
        disputeCount30d: 0,
        payoutPending: 0,
        transactionCount30d: rows.length,
      };
    },

    async adminOverview(): Promise<MerchantAdminOverview> {
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const [agencies, accounts, pending, txs, disputes] = await Promise.all([
        client.from("agencies").select("id, merchant_services_enabled"),
        client.from("merchant_accounts").select("id, status"),
        client.from("merchant_activation_requests").select("id").eq("status", "pending"),
        client
          .from("merchant_transactions")
          .select("amount, status, platform_fee")
          .gte("created_at", since),
        client.from("merchant_disputes").select("id, status").eq("status", "needs_response"),
      ]);

      const agencyRows = agencies.data ?? [];
      const accountRows = accounts.data ?? [];
      const txRows = txs.data ?? [];
      const succeeded = txRows.filter((r) => r.status === "succeeded");

      return {
        totalAgencies: agencyRows.length,
        agenciesWithMerchant: agencyRows.filter((a) => a.merchant_services_enabled).length,
        activeMerchantAccounts: accountRows.filter((a) => a.status === "active").length,
        pendingActivations: (pending.data ?? []).length,
        volume30d: succeeded.reduce((s, r) => s + Number(r.amount), 0),
        platformRevenue30d: succeeded.reduce((s, r) => s + Number(r.platform_fee ?? 0), 0),
        failedPayments30d: txRows.filter((r) => r.status === "failed").length,
        chargebacksOpen: (disputes.data ?? []).length,
      };
    },
  };
}

export type MerchantRepository = ReturnType<typeof createMerchantRepository>;
