"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/auth/session";
import { fail, ok, type ServiceResult } from "@/lib/result";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createMerchantRepository } from "@/repositories/merchant.repository";
import {
  activateAgencyMerchantServices,
  activateSubAccountMerchant,
  approveMerchantActivation,
  connectStripeForBusiness,
  createMerchantPaymentLink,
  deactivateMerchantServices,
  denyMerchantActivation,
  requestMerchantActivation,
  updateGlobalFeeConfig,
} from "@/services/merchant/merchant.service";
import type { PaymentProcessor } from "@/types/merchant-services";

async function requireAdmin(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const user = await requireAuth();
  const { data: admin } = await supabase
    .from("admin_users")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!admin) return { user: null as null, admin: null };
  return { user, admin };
}

export async function approveMerchantActivationAdminAction(
  requestId: string,
  notes?: string,
): Promise<ServiceResult<{ onboardingUrl?: string }>> {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAdmin(supabase);
  if (!auth.user) return fail("Admin access required");

  const result = await approveMerchantActivation(supabase, {
    requestId,
    adminUserId: auth.user.id,
    notes,
  });
  if (result.success) {
    revalidatePath("/admin/merchant-services");
    revalidatePath("/dashboard/merchant-services");
  }
  return result;
}

export async function denyMerchantActivationAdminAction(
  requestId: string,
  notes?: string,
): Promise<ServiceResult<{ ok: true }>> {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAdmin(supabase);
  if (!auth.user) return fail("Admin access required");

  const result = await denyMerchantActivation(supabase, requestId, auth.user.id, notes);
  if (result.success) revalidatePath("/admin/merchant-services");
  return result;
}

export async function deactivateMerchantAdminAction(
  businessId: string,
): Promise<ServiceResult<{ ok: true }>> {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAdmin(supabase);
  if (!auth.user) return fail("Admin access required");

  const result = await deactivateMerchantServices(supabase, businessId, auth.user.id);
  if (result.success) {
    revalidatePath("/admin/merchant-services");
    revalidatePath("/dashboard/merchant-services");
  }
  return result;
}

export async function activateAgencyMerchantAdminAction(
  agencyId: string,
  enabled: boolean,
): Promise<ServiceResult<{ ok: true }>> {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAdmin(supabase);
  if (!auth.user) return fail("Admin access required");

  const result = await activateAgencyMerchantServices(supabase, agencyId, auth.user.id, enabled);
  if (result.success) revalidatePath("/admin/merchant-services");
  return result;
}

export async function activateSubAccountMerchantAdminAction(
  managedId: string,
  enabled: boolean,
): Promise<ServiceResult<{ ok: true }>> {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAdmin(supabase);
  if (!auth.user) return fail("Admin access required");

  const result = await activateSubAccountMerchant(supabase, managedId, auth.user.id, enabled);
  if (result.success) revalidatePath("/admin/merchant-services");
  return result;
}

export async function updateGlobalFeeConfigAdminAction(input: {
  platformFeePercent?: number;
  platformFeeFlat?: number;
  agencyRevenueSharePercent?: number;
  subAccountMarkupPercent?: number;
  payoutDelayDays?: number;
}): Promise<ServiceResult<{ ok: true }>> {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAdmin(supabase);
  if (!auth.user) return fail("Admin access required");

  const result = await updateGlobalFeeConfig(supabase, auth.user.id, input);
  if (result.success) revalidatePath("/admin/merchant-services");
  return result;
}

export async function requestMerchantActivationAction(input: {
  processor?: PaymentProcessor;
  connectionType?: "stripe_connect" | "external_api" | "manual";
  notes?: string;
}): Promise<ServiceResult<{ requestId: string }>> {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!business) return fail("Complete onboarding first.");

  const result = await requestMerchantActivation(supabase, {
    businessId: business.id,
    ownerUserId: user.id,
    processor: input.processor,
    connectionType: input.connectionType,
    notes: input.notes,
  });
  if (result.success) revalidatePath("/dashboard/merchant-services");
  return result;
}

export async function connectStripeMerchantAction(): Promise<ServiceResult<{ url: string }>> {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!business) return fail("Complete onboarding first.");

  const result = await connectStripeForBusiness(supabase, business.id, user.id);
  return result;
}

export async function createPaymentLinkAction(input: {
  name: string;
  amount?: number;
  currency?: string;
}): Promise<ServiceResult<{ url: string; linkId: string }>> {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!business) return fail("Complete onboarding first.");

  const result = await createMerchantPaymentLink(supabase, {
    businessId: business.id,
    ownerUserId: user.id,
    name: input.name,
    amount: input.amount,
    currency: input.currency,
  });
  if (result.success) revalidatePath("/dashboard/merchant-services");
  return result;
}

export async function getMerchantDashboardDataAction(): Promise<
  ServiceResult<{
    account: Awaited<ReturnType<ReturnType<typeof createMerchantRepository>["getMerchantAccount"]>>["data"];
    stats: Awaited<ReturnType<ReturnType<typeof createMerchantRepository>["dashboardStats"]>>;
  }>
> {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!business) return fail("No business found.");

  const repo = createMerchantRepository(supabase);
  const [{ data: account }, stats] = await Promise.all([
    repo.getMerchantAccount(business.id),
    repo.dashboardStats(business.id),
  ]);
  return ok({ account, stats });
}
