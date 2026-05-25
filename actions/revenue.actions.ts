"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";
import { createRevenueEntry } from "@/services/revenue/revenue-entry.service";
import type { AttributionModel, RevenueCloseMethod } from "@/types/revenue-attribution";

export async function addManualRevenueAction(formData: FormData) {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business) return { success: false as const, error: "No business" };

  const amount = Number(formData.get("amount") ?? 0);
  if (!amount || amount <= 0) return { success: false as const, error: "Invalid amount" };

  const result = await createRevenueEntry(supabase, user.id, {
    businessId: business.id,
    leadName: String(formData.get("lead_name") ?? "") || undefined,
    sourceKey: String(formData.get("source_key") ?? "manual_sales"),
    campaign: String(formData.get("campaign") ?? "") || undefined,
    amount,
    closeMethod: String(formData.get("close_method") ?? "manual_entry") as RevenueCloseMethod,
    attributionType: String(
      formData.get("attribution_type") ?? "manual_override",
    ) as AttributionModel,
    notes: String(formData.get("notes") ?? "") || undefined,
    agentKey: String(formData.get("agent_key") ?? "") || undefined,
  });

  if (!result.success) return { success: false as const, error: result.error };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard/campaign-ops");
  return { success: true as const };
}
