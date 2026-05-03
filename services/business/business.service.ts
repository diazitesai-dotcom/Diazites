import type { SupabaseClient } from "@supabase/supabase-js";

import { ok, fail, type ServiceResult } from "@/lib/result";
import { createBillingRepository } from "@/repositories/billing.repository";
import { createBusinessRepository } from "@/repositories/business.repository";
import { createProfileRepository } from "@/repositories/profile.repository";
import type { BusinessUpsertInput } from "@/types/backend";

export async function getBusinessByUser(
  client: SupabaseClient,
  userId: string,
): Promise<ServiceResult<{ id: string } & Record<string, unknown>>> {
  const repo = createBusinessRepository(client);
  const { data, error } = await repo.getByOwnerUserId(userId);
  if (error) return fail(error.message);
  if (!data) return fail("No business for user", "NO_BUSINESS");
  return ok(data as { id: string } & Record<string, unknown>);
}

export async function createBusinessProfile(
  client: SupabaseClient,
  input: {
    ownerUserId: string;
    name: string;
    website?: string | null;
    serviceArea?: string | null;
    cityState?: string | null;
    services?: string | null;
    businessHours?: string | null;
    monthlyBudget?: number;
    logoUrl?: string | null;
    profileFullName?: string | null;
    profilePhone?: string | null;
    /** Default Growth plan from product constants */
    initialPlan?: { name: "Starter" | "Growth" | "Domination"; amount: number };
  },
): Promise<ServiceResult<{ businessId: string }>> {
  const businesses = createBusinessRepository(client);
  const profiles = createProfileRepository(client);
  const billing = createBillingRepository(client);

  const { data: business, error: bErr } = await businesses.insert({
    ownerUserId: input.ownerUserId,
    name: input.name,
    website: input.website,
    serviceArea: input.serviceArea,
    cityState: input.cityState,
    services: input.services,
    businessHours: input.businessHours,
    monthlyBudget: input.monthlyBudget,
    logoUrl: input.logoUrl,
  });

  if (bErr || !business) {
    return fail(bErr?.message ?? "Business insert failed", "BUSINESS_CREATE_FAILED");
  }

  await profiles.upsert({
    userId: input.ownerUserId,
    businessId: business.id,
    fullName: input.profileFullName ?? null,
    phone: input.profilePhone ?? null,
    role: "owner",
  });

  const plan = input.initialPlan ?? { name: "Growth" as const, amount: 997 };
  await billing.upsertPlan({
    businessId: business.id,
    planName: plan.name,
    amount: plan.amount,
    paymentStatus: "active",
  });

  return ok({ businessId: business.id });
}

export async function updateBusinessProfile(
  client: SupabaseClient,
  businessId: string,
  ownerUserId: string,
  patch: BusinessUpsertInput,
): Promise<ServiceResult<unknown>> {
  const businesses = createBusinessRepository(client);
  const { data: existing } = await businesses.getById(businessId);
  if (!existing || existing.user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  const { data: updated, error } = await businesses.update(businessId, patch);
  if (error || !updated) return fail(error?.message ?? "Update failed");
  return ok(updated);
}
