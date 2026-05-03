import type { SupabaseClient } from "@supabase/supabase-js";

import { ok, fail, type ServiceResult } from "@/lib/result";
import { createAdminRepository } from "@/repositories/admin.repository";

/**
 * Uses service-role Supabase client — call only after `requireAdminUser()`.
 */
export async function getAllClients(adminClient: SupabaseClient) {
  const adminRepo = createAdminRepository(adminClient);
  const { data, error } = await adminRepo.listBusinessesWithOwners();
  if (error) return fail(error.message);
  return ok(data ?? []);
}

export async function getSystemMetrics(adminClient: SupabaseClient): Promise<
  ServiceResult<{
    businesses: number;
    users: number;
    leads: number;
  }>
> {
  const { count: bizCount } = await adminClient
    .from("businesses")
    .select("id", { count: "exact", head: true });

  const { count: userCount } = await adminClient
    .from("users")
    .select("id", { count: "exact", head: true });

  const { count: leadCount } = await adminClient
    .from("leads")
    .select("id", { count: "exact", head: true });

  return ok({
    businesses: bizCount ?? 0,
    users: userCount ?? 0,
    leads: leadCount ?? 0,
  });
}

export async function updateClientStage(
  adminClient: SupabaseClient,
  userId: string,
  patch: Record<string, unknown>,
) {
  const adminRepo = createAdminRepository(adminClient);
  const { data, error } = await adminRepo.updateOnboardingRow(userId, patch);
  if (error || !data) return fail(error?.message ?? "Update failed");
  return ok(data);
}

export async function assignAgentToClient(
  adminClient: SupabaseClient,
  businessId: string,
  agentType: string,
  status: "inactive" | "pending" | "active",
) {
  const adminRepo = createAdminRepository(adminClient);
  const { data, error } = await adminRepo.assignAgentForBusiness(businessId, agentType, status);
  if (error || !data) return fail(error?.message ?? "Assign failed");
  return ok(data);
}
