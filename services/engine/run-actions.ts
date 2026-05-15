"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  archiveEngineRun,
  deleteEngineRun,
  saveEngineRunInput,
} from "@/services/engine/run-management.service";

export async function archiveEngineRunAction(runId: string) {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const result = await archiveEngineRun(supabase, runId, user.id);
  if (!result.success) {
    redirect(`/dashboard/engine?error=${encodeURIComponent(result.error)}`);
  }
  revalidatePath("/dashboard/engine");
  redirect("/dashboard/engine?success=archived");
}

export async function deleteEngineRunAction(runId: string) {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const result = await deleteEngineRun(supabase, runId, user.id);
  if (!result.success) {
    redirect(`/dashboard/engine?error=${encodeURIComponent(result.error)}`);
  }
  revalidatePath("/dashboard/engine");
  redirect("/dashboard/engine?success=deleted");
}

export async function saveEngineRunInputAction(
  runId: string,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();

  const inputPayload: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("input_") && typeof value === "string") {
      inputPayload[key.slice(6)] = value.trim();
    }
  }

  const result = await saveEngineRunInput(supabase, runId, user.id, inputPayload);
  if (!result.success) {
    return { ok: false, error: result.error ?? "Save failed" };
  }

  revalidatePath("/dashboard/engine");
  revalidatePath(`/dashboard/engine/${runId}`);
  return { ok: true };
}
