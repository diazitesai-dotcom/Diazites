"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";
import { updateLeadStatus } from "@/services/leads/lead.service";
import type { PipelineStatus } from "@/types/domain";

export async function updateLeadStatusAction(leadId: string, status: PipelineStatus) {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business) {
    return { ok: false as const, error: "Create a business profile first." };
  }

  const result = await updateLeadStatus(supabase, leadId, status, business.id);
  if (!result.success) {
    return { ok: false as const, error: result.error ?? "Update failed" };
  }

  revalidatePath("/dashboard/leads");
  return { ok: true as const };
}
