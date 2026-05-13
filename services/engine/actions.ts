"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/session";
import { fail, ok, type ServiceResult } from "@/lib/result";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";

import {
  advanceEngineRun,
  startEngineRun,
  type EngineInputPayload,
} from "@/services/engine/orchestrator.service";

export async function startEngineRunAction(
  formData: FormData,
): Promise<ServiceResult<{ runId: string }>> {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();

  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business) {
    redirect("/onboarding?error=Complete+onboarding+first");
  }

  const numericBudgetRaw = formData.get("budget");
  const numericBudget =
    typeof numericBudgetRaw === "string" && numericBudgetRaw.trim().length > 0
      ? Number(numericBudgetRaw)
      : undefined;

  const input: EngineInputPayload = {
    websiteUrl: pickString(formData.get("website_url")) ?? business.website ?? undefined,
    niche: pickString(formData.get("niche")) ?? undefined,
    goal: pickString(formData.get("goal")) ?? undefined,
    targetAudience: pickString(formData.get("target_audience")) ?? undefined,
    location:
      pickString(formData.get("location")) ?? business.city_state ?? undefined,
    budget: Number.isFinite(numericBudget) ? numericBudget : undefined,
    trafficSource: pickString(formData.get("traffic_source")) ?? undefined,
  };

  const result = await startEngineRun(supabase, {
    businessId: business.id,
    input,
  });

  if (!result.success) {
    return fail(result.error);
  }

  revalidatePath("/dashboard/engine");
  return ok({ runId: result.data.id });
}

export async function advanceEngineRunAction(
  formData: FormData,
): Promise<ServiceResult<{ runId: string; step: string; status: string }>> {
  await requireAuth();
  const supabase = await createServerSupabaseClient();

  const runId = pickString(formData.get("run_id"));
  if (!runId) return fail("Missing run id");

  const result = await advanceEngineRun(supabase, runId);
  if (!result.success) {
    return fail(result.error);
  }

  revalidatePath("/dashboard/engine");
  return ok({
    runId: result.data.id,
    step: result.data.current_step,
    status: result.data.status,
  });
}

function pickString(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
