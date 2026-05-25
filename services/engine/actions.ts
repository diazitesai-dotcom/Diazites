"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/session";
import { fail, ok, type ServiceResult } from "@/lib/result";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";

import {
  advanceEngineRun,
  runFullEnginePipeline,
  startEngineRun,
  type EngineInputPayload,
} from "@/services/engine/orchestrator.service";
import { seedReadyToLaunchRun } from "@/services/engine/dev-seed.service";
import {
  recreateEngineWithAi,
  type EngineRecreateTarget,
} from "@/services/engine/recreate.service";
import { getEngineRunForOwner } from "@/services/engine/run-management.service";

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

  const osConfigRaw = formData.get("os_config");
  let osConfig: Record<string, unknown> | undefined;
  if (typeof osConfigRaw === "string" && osConfigRaw.trim()) {
    try {
      osConfig = JSON.parse(osConfigRaw) as Record<string, unknown>;
    } catch {
      /* ignore invalid JSON */
    }
  }

  const input: EngineInputPayload = {
    websiteUrl: pickString(formData.get("website_url")) ?? business.website ?? undefined,
    businessName: pickString(formData.get("business_name")) ?? business.name ?? undefined,
    niche: pickString(formData.get("niche")) ?? undefined,
    goal: pickString(formData.get("goal")) ?? undefined,
    targetAudience: pickString(formData.get("target_audience")) ?? undefined,
    location: pickString(formData.get("location")) ?? business.city_state ?? undefined,
    budget: Number.isFinite(numericBudget) ? numericBudget : undefined,
    trafficSource:
      pickString(formData.get("traffic_source")) ?? pickString(formData.get("traffic_sources")) ?? undefined,
    revenueTarget: pickString(formData.get("revenue_target")) ?? undefined,
    competitors: pickString(formData.get("competitors")) ?? undefined,
    painPoints: pickString(formData.get("pain_points")) ?? undefined,
    usp: pickString(formData.get("usp")) ?? undefined,
    brandTone: pickString(formData.get("brand_tone")) ?? undefined,
    servicesProducts: pickString(formData.get("services_products")) ?? undefined,
    testimonials: pickString(formData.get("testimonials")) ?? undefined,
    complianceRestrictions: pickString(formData.get("compliance_restrictions")) ?? undefined,
    contactInfo: pickString(formData.get("contact_info")) ?? undefined,
    crmDestination: pickString(formData.get("crm_destination")) ?? undefined,
    landingStyle: pickString(formData.get("landing_style")) ?? undefined,
    osConfig,
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

/**
 * Dev-only: seed an engine run that is ready to launch.
 *
 *  - Skips Research → Scoring (fills stub-marked but realistic-looking payloads).
 *  - Inserts 4 landing-page variants that pass all 7 launch QA checks.
 *  - Marks variant A as the winner and sets winner_asset_id on the run.
 *  - Leaves current_step at "scoring" so the next "Advance" click runs the
 *    real Launch System (writes a landing_pages row + emits side-effects).
 *
 * Hard-gated by NODE_ENV so production deploys cannot create seeded runs.
 */
export async function seedTestLaunchRunAction(): Promise<
  ServiceResult<{ runId: string }>
> {
  if (process.env.NODE_ENV === "production") {
    return fail("Seed test launch is disabled in production", "forbidden");
  }

  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();

  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business) {
    redirect("/onboarding?error=Complete+onboarding+first");
  }

  const result = await seedReadyToLaunchRun(supabase, business.id);
  if (!result.success) {
    return fail(result.error);
  }

  revalidatePath("/dashboard/engine");
  return ok({ runId: result.data.id });
}

export async function runFullEnginePipelineAction(
  formData: FormData,
): Promise<ServiceResult<{ runId: string; status: string }>> {
  await requireAuth();
  const supabase = await createServerSupabaseClient();
  const runId = pickString(formData.get("run_id"));
  if (!runId) return fail("Missing run id");

  const result = await runFullEnginePipeline(supabase, runId);
  if (!result.success) return fail(result.error);

  revalidatePath("/dashboard/engine");
  return ok({ runId: result.data.id, status: result.data.status });
}

export async function recreateEngineAssetAction(
  formData: FormData,
): Promise<ServiceResult<{ message: string }>> {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const runId = pickString(formData.get("run_id"));
  const target = pickString(formData.get("target")) as EngineRecreateTarget | undefined;
  if (!runId || !target) return fail("Missing run id or target");

  const access = await getEngineRunForOwner(supabase, runId, user.id);
  if (!access.success) return fail(access.error);

  const run = access.data;
  if (run.status !== "running" && run.status !== "needs_approval") {
    return fail("Cannot recreate on a finished run", "invalid_state");
  }

  const result = await recreateEngineWithAi(supabase, run, target);
  if (!result.success) return fail(result.error);

  revalidatePath("/dashboard/engine");
  revalidatePath(`/dashboard/engine/${runId}`);
  return ok({ message: result.data.message });
}

function pickString(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
