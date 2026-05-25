"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/auth/session";
import type { CloneRunPreset } from "@/lib/engine/growth-engine-os-types";
import { fail, ok, type ServiceResult } from "@/lib/result";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";
import { getEngineRunForOwner } from "@/services/engine/run-management.service";
import { startEngineRun, type EngineInputPayload } from "@/services/engine/orchestrator.service";

export async function cloneEngineRunAction(
  sourceRunId: string,
  preset: CloneRunPreset,
): Promise<ServiceResult<{ runId: string }>> {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business) return fail("Business not found");

  const source = await getEngineRunForOwner(supabase, sourceRunId, user.id);
  if (!source.success || !source.data) return fail("Run not found");

  const input = source.data.input_payload as EngineInputPayload & {
    osConfig?: Record<string, unknown>;
    clonePreset?: string;
  };

  const clonedInput: EngineInputPayload & Record<string, unknown> = {
    ...input,
    clonePreset: preset,
    goal:
      preset === "same_business_new_offer"
        ? `${input.goal ?? ""} (new offer variant)`.trim()
        : preset === "same_offer_new_location"
          ? input.goal
          : input.goal,
    location:
      preset === "same_offer_new_location" ? `${input.location ?? ""} (expanded)`.trim() : input.location,
    budget:
      preset === "same_campaign_new_budget"
        ? Math.round((input.budget ?? 1500) * 1.2)
        : input.budget,
    trafficSource:
      preset === "same_campaign_new_platform" ? "Multi-platform expansion" : input.trafficSource,
    niche: preset === "same_funnel_new_niche" ? `${input.niche ?? ""} (adjacent)`.trim() : input.niche,
  };

  if (input.osConfig) {
    clonedInput.osConfig = input.osConfig;
  }

  const result = await startEngineRun(supabase, {
    businessId: business.id,
    input: clonedInput,
  });

  if (!result.success) return fail(result.error);

  revalidatePath("/dashboard/engine");
  return ok({ runId: result.data.id });
}
