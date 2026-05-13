import type { SupabaseClient } from "@supabase/supabase-js";

export type AiUsageStatus = "success" | "error";

export type AiUsageInsert = {
  businessId: string | null;
  runId?: string | null;
  model: string;
  purpose: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  costUsd?: number;
  status?: AiUsageStatus;
  detail?: string | null;
};

export type AiUsageRow = {
  id: string;
  business_id: string | null;
  run_id: string | null;
  model: string;
  purpose: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
  status: AiUsageStatus;
  detail: string | null;
  created_at: string;
};

export function createAiUsageRepository(client: SupabaseClient) {
  return {
    async record(input: AiUsageInsert) {
      const prompt = input.promptTokens ?? 0;
      const completion = input.completionTokens ?? 0;
      const total = input.totalTokens ?? prompt + completion;

      return client.from("ai_usage").insert({
        business_id: input.businessId,
        run_id: input.runId ?? null,
        model: input.model,
        purpose: input.purpose,
        prompt_tokens: prompt,
        completion_tokens: completion,
        total_tokens: total,
        cost_usd: input.costUsd ?? 0,
        status: input.status ?? "success",
        detail: input.detail ?? null,
      });
    },

    async sumThisMonth(businessId: string) {
      const since = startOfThisMonthIso();
      return client
        .from("ai_usage")
        .select("cost_usd, total_tokens")
        .eq("business_id", businessId)
        .gte("created_at", since);
    },

    async listForRun(runId: string) {
      return client
        .from("ai_usage")
        .select("*")
        .eq("run_id", runId)
        .order("created_at", { ascending: true });
    },

    async listRecentAcrossOrg(limit = 200) {
      return client
        .from("ai_usage")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
    },

    async sumLastNDaysAcrossOrg(days: number) {
      const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
      return client
        .from("ai_usage")
        .select("cost_usd, total_tokens, status, model, purpose, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false });
    },
  };
}

function startOfThisMonthIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}
