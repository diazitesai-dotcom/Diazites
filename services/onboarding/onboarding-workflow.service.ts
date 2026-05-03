import type { SupabaseClient } from "@supabase/supabase-js";

import { ok, fail, type ServiceResult } from "@/lib/result";
import { createOnboardingRepository } from "@/repositories/onboarding.repository";
import type { OnboardingStageDb } from "@/types/backend";
import { EVENT_TYPES } from "@/types/backend";

import { triggerEvent } from "@/services/events/event-dispatcher";

export async function updateOnboardingStage(
  client: SupabaseClient,
  userId: string,
  businessId: string,
  stage: OnboardingStageDb,
): Promise<ServiceResult<unknown>> {
  const onboarding = createOnboardingRepository(client);
  const { data, error } = await onboarding.updateStage(userId, stage);
  if (error || !data) return fail(error?.message ?? "Stage update failed");

  await triggerEvent(client, {
    type: EVENT_TYPES.ONBOARDING_STAGE_CHANGED,
    businessId,
    payload: { stage },
  });

  return ok(data);
}

export async function getOnboardingChecklist(client: SupabaseClient, userId: string) {
  const onboarding = createOnboardingRepository(client);
  const { data, error } = await onboarding.getByUserId(userId);
  if (error) return fail(error.message);
  return ok(
    data ?? {
      checklist: {},
      stage: "signup" as const,
    },
  );
}
