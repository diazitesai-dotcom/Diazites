import type { SupabaseClient } from "@supabase/supabase-js";

import { fail, ok, type ServiceResult } from "@/lib/result";
import { createBusinessRepository } from "@/repositories/business.repository";
import {
  createEngineRepository,
  type EngineRunRow,
} from "@/repositories/engine.repository";

export async function getEngineRunForOwner(
  client: SupabaseClient,
  runId: string,
  ownerUserId: string,
): Promise<ServiceResult<EngineRunRow>> {
  const engine = createEngineRepository(client);
  const { data: run, error } = await engine.getRunById(runId);
  if (error || !run) {
    return fail("Run not found", "NOT_FOUND");
  }

  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(run.business_id);
  if (!business || business.user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  return ok(run as EngineRunRow);
}

export async function archiveEngineRun(
  client: SupabaseClient,
  runId: string,
  ownerUserId: string,
): Promise<ServiceResult<EngineRunRow>> {
  const access = await getEngineRunForOwner(client, runId, ownerUserId);
  if (!access.success) return access;

  const engine = createEngineRepository(client);
  const { data, error } = await engine.archiveRun(runId);
  if (error || !data) {
    return fail(error?.message ?? "Archive failed");
  }
  return ok(data as EngineRunRow);
}

export async function deleteEngineRun(
  client: SupabaseClient,
  runId: string,
  ownerUserId: string,
): Promise<ServiceResult<void>> {
  const access = await getEngineRunForOwner(client, runId, ownerUserId);
  if (!access.success) return access as ServiceResult<void>;

  const engine = createEngineRepository(client);
  const { error } = await engine.deleteRun(runId);
  if (error) return fail(error.message);
  return ok(undefined);
}

export async function saveEngineRunInput(
  client: SupabaseClient,
  runId: string,
  ownerUserId: string,
  inputPayload: Record<string, unknown>,
): Promise<ServiceResult<EngineRunRow>> {
  const access = await getEngineRunForOwner(client, runId, ownerUserId);
  if (!access.success) return access;

  const engine = createEngineRepository(client);
  const { data, error } = await engine.updateInputPayload(runId, inputPayload);
  if (error || !data) {
    return fail(error?.message ?? "Save failed");
  }
  return ok(data as EngineRunRow);
}
