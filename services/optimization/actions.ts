"use server";

import { revalidatePath } from "next/cache";

import { logAudit } from "@/lib/audit/log";
import { requireAuth } from "@/lib/auth/session";
import { fail, ok, type ServiceResult } from "@/lib/result";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";
import {
  createEngineDecisionRepository,
  type EngineDecisionStatus,
} from "@/repositories/engine-telemetry.repository";
import { runOptimizationForBusiness } from "@/services/optimization/optimization.service";

async function resolveContext() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business) return null;
  return { supabase, userId: user.id, businessId: business.id };
}

export async function runOptimizationNowAction(): Promise<ServiceResult<{
  eventsConsidered: number;
  decisionsGenerated: number;
}>> {
  const ctx = await resolveContext();
  if (!ctx) return fail("No business found");

  const sinceIso = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const untilIso = new Date().toISOString();

  const result = await runOptimizationForBusiness(ctx.supabase, ctx.businessId, {
    sinceIso,
    untilIso,
  });
  if (!result.success) return fail(result.error);

  await logAudit(ctx.supabase, {
    businessId: ctx.businessId,
    actorUserId: ctx.userId,
    action: "optimization.manual_run",
    metadata: result.data,
  });

  revalidatePath("/dashboard/optimization");
  return ok(result.data);
}

export async function updateDecisionStatusAction(
  formData: FormData,
): Promise<ServiceResult<{ ok: true }>> {
  const ctx = await resolveContext();
  if (!ctx) return fail("No business found");

  const id = pick(formData, "id");
  const status = pick(formData, "status") as EngineDecisionStatus | undefined;
  if (!id || !status) return fail("Missing id or status");
  if (!["approved", "rejected", "applied"].includes(status)) {
    return fail("Invalid status");
  }

  const repo = createEngineDecisionRepository(ctx.supabase);
  const { error } = await repo.updateStatus(id, {
    status,
    decidedBy: ctx.userId,
  });
  if (error) return fail(error.message);

  await logAudit(ctx.supabase, {
    businessId: ctx.businessId,
    actorUserId: ctx.userId,
    action: `optimization.decision.${status}`,
    targetKind: "engine_decision",
    targetId: id,
  });

  revalidatePath("/dashboard/optimization");
  return ok({ ok: true });
}

function pick(fd: FormData, key: string): string | undefined {
  const v = fd.get(key);
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}
