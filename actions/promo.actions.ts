"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/auth/session";
import { fail, ok, type ServiceResult } from "@/lib/result";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { validatePromoCode, storeSignupPromoCode } from "@/services/billing/promo-code.service";
import { createPromoCodeRepository } from "@/repositories/promo-code.repository";

export async function validatePromoCodePublicAction(
  code: string,
): Promise<ServiceResult<{ message: string; trialDays: number }>> {
  const supabase = await createServerSupabaseClient();
  const result = await validatePromoCode(supabase, code);
  if (!result.success) return result;
  return ok({ message: result.data.message, trialDays: result.data.trialDays });
}

export async function validatePromoCodeAction(
  code: string,
): Promise<ServiceResult<{ message: string; trialDays: number }>> {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const result = await validatePromoCode(supabase, code, user.id);
  if (!result.success) return result;
  return ok({ message: result.data.message, trialDays: result.data.trialDays });
}

export async function redeemSignupPromoAction(
  code: string,
): Promise<ServiceResult<{ message: string }>> {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  return storeSignupPromoCode(supabase, user.id, code);
}

export async function createPromoCodeAdminAction(input: {
  code: string;
  trialDays: number;
  maxUses?: number | null;
  source?: string;
  adminNotes?: string;
}): Promise<ServiceResult<{ id: string }>> {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const { data: admin } = await supabase
    .from("admin_users")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!admin) return fail("Admin access required");

  const repo = createPromoCodeRepository(supabase);
  const { data, error } = await repo.create({
    code: input.code,
    trialDays: input.trialDays,
    maxUses: input.maxUses,
    source: input.source,
    adminNotes: input.adminNotes,
  });
  if (error || !data) return fail(error?.message ?? "Failed to create code");

  revalidatePath("/admin/promo-codes");
  return ok({ id: data.id });
}

export async function togglePromoCodeAdminAction(
  id: string,
  active: boolean,
): Promise<ServiceResult<void>> {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const { data: admin } = await supabase
    .from("admin_users")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!admin) return fail("Admin access required");

  const repo = createPromoCodeRepository(supabase);
  const { error } = await repo.update(id, { active });
  if (error) return fail(error.message);

  revalidatePath("/admin/promo-codes");
  return ok(undefined);
}
