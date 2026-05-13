import type { SupabaseClient } from "@supabase/supabase-js";

export type EngineStep =
  | "input"
  | "research"
  | "strategy"
  | "funnel"
  | "generation"
  | "variants"
  | "scoring"
  | "launch";

export type EngineRunStatus =
  | "running"
  | "needs_approval"
  | "launched"
  | "failed"
  | "archived";

export type AssetKind =
  | "landing_page"
  | "ad"
  | "email"
  | "sms"
  | "headline"
  | "faq"
  | "lead_magnet"
  | "social_proof";

export type EngineRunRow = {
  id: string;
  business_id: string;
  current_step: EngineStep;
  status: EngineRunStatus;
  input_payload: Record<string, unknown>;
  research_payload: Record<string, unknown> | null;
  strategy_payload: Record<string, unknown> | null;
  funnel_payload: Record<string, unknown> | null;
  generation_payload: Record<string, unknown> | null;
  variants_payload: Record<string, unknown> | null;
  scoring_payload: Record<string, unknown> | null;
  launch_payload: Record<string, unknown> | null;
  winner_asset_id: string | null;
  launched_at: string | null;
  failed_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type AssetRow = {
  id: string;
  run_id: string;
  business_id: string;
  kind: AssetKind;
  variant_label: string;
  payload: Record<string, unknown>;
  score: Record<string, unknown> | null;
  is_winner: boolean;
  created_at: string;
};

const STEP_TO_PAYLOAD_COLUMN: Record<EngineStep, keyof EngineRunRow> = {
  input: "input_payload",
  research: "research_payload",
  strategy: "strategy_payload",
  funnel: "funnel_payload",
  generation: "generation_payload",
  variants: "variants_payload",
  scoring: "scoring_payload",
  launch: "launch_payload",
};

export function payloadColumnForStep(step: EngineStep): keyof EngineRunRow {
  return STEP_TO_PAYLOAD_COLUMN[step];
}

export function createEngineRepository(client: SupabaseClient) {
  return {
    async createRun(input: {
      businessId: string;
      inputPayload: Record<string, unknown>;
    }) {
      return client
        .from("growth_engine_runs")
        .insert({
          business_id: input.businessId,
          input_payload: input.inputPayload,
          current_step: "input",
          status: "running",
        })
        .select("*")
        .single();
    },

    async getRunById(runId: string) {
      return client
        .from("growth_engine_runs")
        .select("*")
        .eq("id", runId)
        .maybeSingle();
    },

    async getActiveRunForBusiness(businessId: string) {
      return client
        .from("growth_engine_runs")
        .select("*")
        .eq("business_id", businessId)
        .in("status", ["running", "needs_approval"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
    },

    async listRunsForBusiness(businessId: string, limit = 25) {
      return client
        .from("growth_engine_runs")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(limit);
    },

    async updateStep(runId: string, step: EngineStep) {
      return client
        .from("growth_engine_runs")
        .update({ current_step: step })
        .eq("id", runId)
        .select("*")
        .single();
    },

    async updateStepPayload(
      runId: string,
      step: EngineStep,
      payload: Record<string, unknown>,
    ) {
      const column = payloadColumnForStep(step);
      return client
        .from("growth_engine_runs")
        .update({ [column]: payload })
        .eq("id", runId)
        .select("*")
        .single();
    },

    async updateStatus(
      runId: string,
      status: EngineRunStatus,
      extra?: { failedReason?: string | null; launchedAt?: string | null },
    ) {
      const row: Record<string, unknown> = { status };
      if (extra?.failedReason !== undefined) row.failed_reason = extra.failedReason;
      if (extra?.launchedAt !== undefined) row.launched_at = extra.launchedAt;

      return client
        .from("growth_engine_runs")
        .update(row)
        .eq("id", runId)
        .select("*")
        .single();
    },

    async setWinnerAsset(runId: string, assetId: string) {
      return client
        .from("growth_engine_runs")
        .update({ winner_asset_id: assetId })
        .eq("id", runId)
        .select("*")
        .single();
    },

    async insertAsset(input: {
      runId: string;
      businessId: string;
      kind: AssetKind;
      variantLabel: string;
      payload: Record<string, unknown>;
      score?: Record<string, unknown> | null;
      isWinner?: boolean;
    }) {
      return client
        .from("assets")
        .insert({
          run_id: input.runId,
          business_id: input.businessId,
          kind: input.kind,
          variant_label: input.variantLabel,
          payload: input.payload,
          score: input.score ?? null,
          is_winner: input.isWinner ?? false,
        })
        .select("*")
        .single();
    },

    async insertAssetsBulk(
      rows: ReadonlyArray<{
        runId: string;
        businessId: string;
        kind: AssetKind;
        variantLabel: string;
        payload: Record<string, unknown>;
      }>,
    ) {
      if (rows.length === 0) return { data: [] as AssetRow[], error: null };
      return client
        .from("assets")
        .insert(
          rows.map((r) => ({
            run_id: r.runId,
            business_id: r.businessId,
            kind: r.kind,
            variant_label: r.variantLabel,
            payload: r.payload,
          })),
        )
        .select("*");
    },

    async updateAssetScore(
      assetId: string,
      score: Record<string, unknown>,
      isWinner: boolean,
    ) {
      return client
        .from("assets")
        .update({ score, is_winner: isWinner })
        .eq("id", assetId)
        .select("*")
        .single();
    },

    async listAssetsForRun(runId: string) {
      return client
        .from("assets")
        .select("*")
        .eq("run_id", runId)
        .order("kind", { ascending: true })
        .order("variant_label", { ascending: true });
    },

    async getAsset(assetId: string) {
      return client
        .from("assets")
        .select("*")
        .eq("id", assetId)
        .maybeSingle();
    },

    async listAssetsForRunByKind(runId: string, kind: AssetKind) {
      return client
        .from("assets")
        .select("*")
        .eq("run_id", runId)
        .eq("kind", kind)
        .order("variant_label", { ascending: true });
    },

    async markWinner(assetId: string) {
      return client
        .from("assets")
        .update({ is_winner: true })
        .eq("id", assetId)
        .select("*")
        .single();
    },

    async clearWinnersForRunAndKind(runId: string, kind: AssetKind) {
      return client
        .from("assets")
        .update({ is_winner: false })
        .eq("run_id", runId)
        .eq("kind", kind);
    },
  };
}
