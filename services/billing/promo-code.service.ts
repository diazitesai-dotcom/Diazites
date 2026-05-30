import type { SupabaseClient } from "@supabase/supabase-js";

import { ok, fail, type ServiceResult } from "@/lib/result";
import { createPromoCodeRepository } from "@/repositories/promo-code.repository";

export async function validatePromoCode(
  client: SupabaseClient,
  code: string,
  userId?: string,
): Promise<
  ServiceResult<{
    code: string;
    trialDays: number;
    message: string;
  }>
> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return fail("Enter a promo code");

  const repo = createPromoCodeRepository(client);
  const { data: row, error } = await repo.getByCode(normalized);
  if (error) return fail(error.message);
  if (!row) return fail("Invalid or expired promo code");

  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return fail("This promo code has expired");
  }

  if (row.max_uses != null && row.use_count >= row.max_uses) {
    return fail("This promo code has reached its usage limit");
  }

  if (userId && row.single_use_per_user) {
    const { data: existing } = await repo.hasUserRedeemed(row.id, userId);
    if (existing) return fail("You have already used this promo code");
  }

  return ok({
    code: row.code,
    trialDays: row.trial_days,
    message: `${row.trial_days} Day Trial Activated.`,
  });
}

export async function storeSignupPromoCode(
  client: SupabaseClient,
  userId: string,
  code: string,
): Promise<ServiceResult<{ message: string }>> {
  const validated = await validatePromoCode(client, code, userId);
  if (!validated.success) return validated;

  const repo = createPromoCodeRepository(client);
  await repo.savePendingSignupPromo(userId, validated.data.code, validated.data.trialDays);

  return ok({ message: validated.data.message });
}
