import type { SupabaseClient } from "@supabase/supabase-js";

import { fail, ok, type ServiceResult } from "@/lib/result";
import {
  createEngineRepository,
  type AssetKind,
  type EngineRunRow,
} from "@/repositories/engine.repository";
import { isOpenAiConfigured } from "@/services/engine/ai/openai-client";
import type { EngineFunnel } from "@/services/engine/ai/funnel.ai";
import { runFunnelStep } from "@/services/engine/ai/funnel.ai";
import type { EngineGenerationPlan } from "@/services/engine/ai/generation.ai";
import type { EngineResearch } from "@/services/engine/ai/research.ai";
import type { EngineStrategy } from "@/services/engine/ai/strategy.ai";
import {
  flattenVariants,
  runVariantsStep,
  runVariantsStepForKind,
} from "@/services/engine/ai/variants.ai";
import {
  PHASE3_ASSET_KINDS,
  type Phase3AssetKind,
} from "@/services/engine/ai/generation.ai";
import type { EngineInputPayload } from "@/services/engine/orchestrator.service";
import { isStubbed } from "@/services/engine/recreate.utils";

export type EngineRecreateTarget =
  | "funnel"
  | "all_assets"
  | Phase3AssetKind;

function requireAiContext(run: EngineRunRow): ServiceResult<{
  input: EngineInputPayload;
  research: EngineResearch;
  strategy: EngineStrategy;
  funnel: EngineFunnel;
  plan: EngineGenerationPlan;
}> {
  if (!isOpenAiConfigured()) {
    return fail("Set OPENAI_API_KEY to use AI recreate.", "forbidden");
  }
  if (
    isStubbed(run.research_payload) ||
    isStubbed(run.strategy_payload) ||
    isStubbed(run.funnel_payload) ||
    isStubbed(run.generation_payload)
  ) {
    return fail(
      "Run Research → Generation first so AI has real strategy and funnel context.",
      "invalid_state",
    );
  }
  return ok({
    input: run.input_payload as EngineInputPayload,
    research: run.research_payload as unknown as EngineResearch,
    strategy: run.strategy_payload as unknown as EngineStrategy,
    funnel: run.funnel_payload as unknown as EngineFunnel,
    plan: run.generation_payload as unknown as EngineGenerationPlan,
  });
}

export async function recreateEngineWithAi(
  client: SupabaseClient,
  run: EngineRunRow,
  target: EngineRecreateTarget,
): Promise<ServiceResult<{ message: string }>> {
  const engine = createEngineRepository(client);

  if (target === "funnel") {
    if (!isOpenAiConfigured() || isStubbed(run.research_payload) || isStubbed(run.strategy_payload)) {
      return fail("Complete Research and Strategy before recreating the funnel.", "invalid_state");
    }
    const result = await runFunnelStep({
      supabase: client,
      businessId: run.business_id,
      runId: run.id,
      input: run.input_payload as EngineInputPayload,
      research: run.research_payload as unknown as EngineResearch,
      strategy: run.strategy_payload as unknown as EngineStrategy,
    });
    if (!result.success) return fail(result.error);
    const { error } = await engine.updateStepPayload(run.id, "funnel", result.data as Record<string, unknown>);
    if (error) return fail(error.message);
    return ok({ message: "Funnel blueprint recreated with AI." });
  }

  const ctx = requireAiContext(run);
  if (!ctx.success) return ctx;

  const base = {
    supabase: client,
    businessId: run.business_id,
    runId: run.id,
    ...ctx.data,
  };

  if (target === "all_assets") {
    await engine.deleteAllAssetsForRun(run.id);
    const result = await runVariantsStep(base);
    if (!result.success) return fail(result.error);
    const flattened = flattenVariants(result.data);
    const { error: bulkError } = await engine.insertAssetsBulk(
      flattened.map((v) => ({
        runId: run.id,
        businessId: run.business_id,
        kind: v.kind,
        variantLabel: v.variantLabel,
        payload: v.payload,
      })),
    );
    if (bulkError) return fail(bulkError.message);
    await engine.updateStepPayload(run.id, "variants", {
      assetsCreated: flattened.length,
      recreated: true,
    });
    return ok({
      message: `Recreated ${flattened.length} assets (landing, ads, email, headlines). Re-run Scoring to pick a new winner.`,
    });
  }

  const kind = target as Phase3AssetKind;
  if (!PHASE3_ASSET_KINDS.includes(kind)) {
    return fail(`Unknown asset kind: ${kind}`, "invalid_state");
  }

  await engine.deleteAssetsForRunByKind(run.id, kind as AssetKind);
  const result = await runVariantsStepForKind({ ...base, kind });
  if (!result.success) return fail(result.error);

  const rows = (["A", "B", "C", "D"] as const).map((label) => ({
    runId: run.id,
    businessId: run.business_id,
    kind: kind as AssetKind,
    variantLabel: label,
    payload: result.data[label],
  }));
  const { error: bulkError } = await engine.insertAssetsBulk(rows);
  if (bulkError) return fail(bulkError.message);

  const label =
    kind === "landing_page" ? "Landing pages" : kind === "ad" ? "Ads" : kind === "email" ? "Emails" : "Headlines";
  return ok({
    message: `${label} recreated (variants A–D). Re-run Scoring if this run is past Stage 6.`,
  });
}
