import type { SupabaseClient } from "@supabase/supabase-js";

export type EngineEventRow = {
  id: string;
  business_id: string;
  ad_campaign_id: string | null;
  landing_page_id: string | null;
  asset_id: string | null;
  event_type: string;
  payload: Record<string, unknown>;
  occurred_at: string;
  created_at: string;
};

export type EngineDecisionActionKind =
  | "pause_variant"
  | "scale_budget"
  | "reduce_budget"
  | "swap_headline"
  | "rerun_engine"
  | "no_op";

export type EngineDecisionStatus =
  | "pending" | "approved" | "applied" | "rejected" | "errored";

export type EngineDecisionRow = {
  id: string;
  business_id: string;
  optimization_run_id: string | null;
  rationale: string;
  action_kind: EngineDecisionActionKind;
  action_payload: Record<string, unknown>;
  status: EngineDecisionStatus;
  applied_at: string | null;
  decided_by: string | null;
  detail: string | null;
  created_at: string;
};

export type OptimizationRunRow = {
  id: string;
  business_id: string;
  window_started_at: string;
  window_ended_at: string;
  events_considered: number;
  decisions_generated: number;
  status: "success" | "error" | "skipped";
  detail: string | null;
  created_at: string;
};

export function createEngineEventRepository(client: SupabaseClient) {
  return {
    async record(input: {
      businessId: string;
      eventType: string;
      adCampaignId?: string | null;
      landingPageId?: string | null;
      assetId?: string | null;
      payload?: Record<string, unknown>;
    }) {
      return client.from("engine_events").insert({
        business_id: input.businessId,
        ad_campaign_id: input.adCampaignId ?? null,
        landing_page_id: input.landingPageId ?? null,
        asset_id: input.assetId ?? null,
        event_type: input.eventType,
        payload: input.payload ?? {},
      });
    },

    async listRecent(businessId: string, hours = 24) {
      const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
      return client
        .from("engine_events")
        .select("*")
        .eq("business_id", businessId)
        .gte("occurred_at", since)
        .order("occurred_at", { ascending: false });
    },

    async countByTypeSince(businessId: string, sinceIso: string) {
      return client
        .from("engine_events")
        .select("event_type")
        .eq("business_id", businessId)
        .gte("occurred_at", sinceIso);
    },
  };
}

export function createEngineDecisionRepository(client: SupabaseClient) {
  return {
    async insert(input: {
      businessId: string;
      optimizationRunId?: string | null;
      rationale: string;
      actionKind: EngineDecisionActionKind;
      actionPayload?: Record<string, unknown>;
      status?: EngineDecisionStatus;
    }) {
      return client
        .from("engine_decisions")
        .insert({
          business_id: input.businessId,
          optimization_run_id: input.optimizationRunId ?? null,
          rationale: input.rationale,
          action_kind: input.actionKind,
          action_payload: input.actionPayload ?? {},
          status: input.status ?? "pending",
        })
        .select("*")
        .single();
    },

    async listForBusiness(businessId: string, limit = 50) {
      return client
        .from("engine_decisions")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(limit);
    },

    async updateStatus(
      id: string,
      input: { status: EngineDecisionStatus; decidedBy?: string | null; detail?: string | null },
    ) {
      const row: Record<string, unknown> = { status: input.status };
      if (input.status === "applied") row.applied_at = new Date().toISOString();
      if (input.decidedBy !== undefined) row.decided_by = input.decidedBy;
      if (input.detail !== undefined) row.detail = input.detail;

      return client
        .from("engine_decisions")
        .update(row)
        .eq("id", id)
        .select("*")
        .single();
    },
  };
}

export function createOptimizationRunRepository(client: SupabaseClient) {
  return {
    async insert(input: {
      businessId: string;
      windowStartedAt: string;
      windowEndedAt: string;
      eventsConsidered: number;
      decisionsGenerated: number;
      status?: "success" | "error" | "skipped";
      detail?: string | null;
    }) {
      return client
        .from("optimization_runs")
        .insert({
          business_id: input.businessId,
          window_started_at: input.windowStartedAt,
          window_ended_at: input.windowEndedAt,
          events_considered: input.eventsConsidered,
          decisions_generated: input.decisionsGenerated,
          status: input.status ?? "success",
          detail: input.detail ?? null,
        })
        .select("*")
        .single();
    },

    async listForBusiness(businessId: string, limit = 20) {
      return client
        .from("optimization_runs")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(limit);
    },
  };
}
