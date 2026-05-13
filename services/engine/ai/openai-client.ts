import OpenAI from "openai";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";

import { env } from "@/lib/env";
import { fail, ok, type ServiceResult } from "@/lib/result";
import { createAiUsageRepository } from "@/repositories/ai-usage.repository";

export const ENGINE_DEFAULT_MODEL = "gpt-4.1-mini";

/**
 * Approximate per-1M-token USD pricing for the models we use in the engine.
 * Tune these as OpenAI pricing changes; treated as estimates, not invoices.
 */
const MODEL_PRICING: Record<string, { inputPer1M: number; outputPer1M: number }> = {
  "gpt-4.1-mini": { inputPer1M: 0.4, outputPer1M: 1.6 },
  "gpt-4.1": { inputPer1M: 2.0, outputPer1M: 8.0 },
  "gpt-4o-mini": { inputPer1M: 0.15, outputPer1M: 0.6 },
  "gpt-4o": { inputPer1M: 2.5, outputPer1M: 10.0 },
};

export function estimateCostUsd(
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const p = MODEL_PRICING[model];
  if (!p) return 0;
  return (
    (promptTokens / 1_000_000) * p.inputPer1M +
    (completionTokens / 1_000_000) * p.outputPer1M
  );
}

export function isOpenAiConfigured(): boolean {
  return Boolean(env.OPENAI_API_KEY?.trim());
}

export type CallJsonArgs<T> = {
  supabase: SupabaseClient;
  businessId: string | null;
  runId?: string | null;
  purpose: string;
  /** Zod schema the parsed JSON must satisfy. */
  schema: z.ZodType<T>;
  /** Human-readable instruction. JSON-only constraint is auto-appended. */
  prompt: string;
  /** Optional system-style preamble prepended to the prompt. */
  system?: string;
  /** Override the default model. */
  model?: string;
};

/**
 * Calls the OpenAI Responses API expecting a JSON object, validates it against
 * a Zod schema, and records the call in `ai_usage`.
 *
 * Robust to:
 *  - Missing OPENAI_API_KEY (returns AI_CONFIG fail; caller can fall back).
 *  - Models that wrap JSON in ```json fences (stripped before parsing).
 *  - Models that return prose around the JSON (extracts first {...} block).
 */
export async function callJsonResponses<T>(
  args: CallJsonArgs<T>,
): Promise<ServiceResult<T>> {
  if (!isOpenAiConfigured()) {
    return fail("OPENAI_API_KEY not configured", "AI_CONFIG");
  }

  const model = args.model ?? ENGINE_DEFAULT_MODEL;
  const fullPrompt = buildPrompt(args.prompt, args.system);
  const usage = createAiUsageRepository(args.supabase);

  let client: OpenAI;
  try {
    client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  } catch (e) {
    return fail(
      e instanceof Error ? e.message : "Failed to init OpenAI client",
      "AI_CONFIG",
    );
  }

  try {
    const response = await client.responses.create({
      model,
      input: fullPrompt,
    });

    const raw = response.output_text?.trim();
    if (!raw) {
      await safeRecord(usage, {
        businessId: args.businessId,
        runId: args.runId,
        purpose: args.purpose,
        model,
        status: "error",
        detail: "Empty model output",
      });
      return fail("Empty AI response", "AI_EMPTY");
    }

    const jsonText = extractJsonObject(raw);
    if (!jsonText) {
      await safeRecord(usage, {
        businessId: args.businessId,
        runId: args.runId,
        purpose: args.purpose,
        model,
        status: "error",
        detail: `No JSON object in response: ${raw.slice(0, 200)}`,
      });
      return fail("AI did not return JSON", "AI_NON_JSON");
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(jsonText);
    } catch (e) {
      await safeRecord(usage, {
        businessId: args.businessId,
        runId: args.runId,
        purpose: args.purpose,
        model,
        status: "error",
        detail:
          (e instanceof Error ? e.message : "JSON parse failed") +
          " · " +
          jsonText.slice(0, 200),
      });
      return fail("AI returned invalid JSON", "AI_BAD_JSON");
    }

    const validated = args.schema.safeParse(parsedJson);
    if (!validated.success) {
      await safeRecord(usage, {
        businessId: args.businessId,
        runId: args.runId,
        purpose: args.purpose,
        model,
        status: "error",
        detail: `Schema error: ${validated.error.message}`,
      });
      return fail("AI response did not match expected shape", "AI_SCHEMA");
    }

    const responseUsage = (response as { usage?: { input_tokens?: number; output_tokens?: number; total_tokens?: number } }).usage;
    const promptTokens = responseUsage?.input_tokens ?? 0;
    const completionTokens = responseUsage?.output_tokens ?? 0;
    const totalTokens = responseUsage?.total_tokens ?? promptTokens + completionTokens;
    const costUsd = estimateCostUsd(model, promptTokens, completionTokens);

    await safeRecord(usage, {
      businessId: args.businessId,
      runId: args.runId,
      purpose: args.purpose,
      model,
      promptTokens,
      completionTokens,
      totalTokens,
      costUsd,
      status: "success",
    });

    return ok(validated.data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "OpenAI request failed";
    await safeRecord(usage, {
      businessId: args.businessId,
      runId: args.runId,
      purpose: args.purpose,
      model,
      status: "error",
      detail: message,
    });
    return fail(message, "AI_ERROR");
  }
}

function buildPrompt(userPrompt: string, system?: string): string {
  const systemBlock = system?.trim().length
    ? `${system.trim()}\n\n---\n\n`
    : "";
  const constraint =
    "\n\nRespond with ONLY a single valid JSON object that matches the requested schema. " +
    "Do not include markdown code fences, commentary, or any text outside the JSON object.";
  return `${systemBlock}${userPrompt.trim()}${constraint}`;
}

function extractJsonObject(raw: string): string | null {
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1].trim() : raw.trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end < 0 || end <= start) return null;
  return candidate.slice(start, end + 1);
}

type UsageRepo = ReturnType<typeof createAiUsageRepository>;

async function safeRecord(
  repo: UsageRepo,
  input: Parameters<UsageRepo["record"]>[0],
) {
  try {
    await repo.record(input);
  } catch {
    // Telemetry must not break the caller.
  }
}
