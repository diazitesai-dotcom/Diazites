"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";
import {
  createLead,
  deleteLead,
  saveLead,
  updateLeadStatus,
} from "@/services/leads/lead.service";
import type { LeadUpdateInput } from "@/types/backend";
import type { PipelineStatus } from "@/types/domain";

async function getBusinessForUser() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  return { user, supabase, business };
}

export async function updateLeadStatusAction(leadId: string, status: PipelineStatus) {
  const { user, supabase, business } = await getBusinessForUser();
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

export async function saveLeadAction(
  leadId: string,
  input: LeadUpdateInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { user, supabase, business } = await getBusinessForUser();
  if (!business) {
    return { ok: false, error: "Create a business profile first." };
  }

  const result = await saveLead(supabase, leadId, business.id, user.id, input);
  if (!result.success) {
    return { ok: false, error: result.error ?? "Save failed" };
  }

  revalidatePath("/dashboard/leads");
  return { ok: true };
}

export async function deleteLeadAction(
  leadId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { user, supabase, business } = await getBusinessForUser();
  if (!business) {
    return { ok: false, error: "Create a business profile first." };
  }

  const result = await deleteLead(supabase, leadId, business.id, user.id);
  if (!result.success) {
    return { ok: false, error: result.error ?? "Delete failed" };
  }

  revalidatePath("/dashboard/leads");
  return { ok: true };
}

export async function createLeadAction(
  formData: FormData,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const { supabase, business } = await getBusinessForUser();
  if (!business) {
    return { ok: false, error: "Create a business profile first." };
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { ok: false, error: "Name is required." };
  }

  const result = await createLead(supabase, {
    businessId: business.id,
    name,
    phone: pick(formData.get("phone")),
    email: pick(formData.get("email")),
    address: pick(formData.get("address")),
    roofingNeed: pick(formData.get("roofing_need")),
    timeline: pick(formData.get("timeline")),
    notes: pick(formData.get("notes")),
    source: pick(formData.get("source")) ?? "manual",
  });

  if (!result.success) {
    return { ok: false, error: result.error ?? "Create failed" };
  }

  revalidatePath("/dashboard/leads");
  return { ok: true, id: result.data.id };
}

function pick(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const t = value.trim();
  return t.length > 0 ? t : undefined;
}
