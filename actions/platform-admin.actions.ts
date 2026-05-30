"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/auth/session";
import { fail, ok, type ServiceResult } from "@/lib/result";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import {
  linkSubAccountToAgency,
  registerAgencyAccount,
  updatePlatformAccountAdmin,
} from "@/services/admin/platform-accounts.service";
import type {
  PlatformAccountStatus,
  PlatformAccountType,
  PlatformFeatureFlags,
  UsageLimitOverrides,
} from "@/types/platform-admin";

async function requirePlatformAdmin() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const { data: admin } = await supabase
    .from("admin_users")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!admin) return null;
  const service = createServiceRoleClient();
  return { user, service };
}

export async function createAgencyAccountAdminAction(input: {
  businessId: string;
  agencyName: string;
}): Promise<ServiceResult<{ agencyId: string }>> {
  const ctx = await requirePlatformAdmin();
  if (!ctx) return fail("Admin access required");

  const result = await registerAgencyAccount(ctx.service, ctx.user.id, input);
  if (result.success) {
    revalidatePath("/admin/accounts");
    revalidatePath("/admin");
  }
  return result;
}

export async function updateAccountAdminAction(
  businessId: string,
  patch: {
    status?: PlatformAccountStatus;
    accountType?: PlatformAccountType;
    planName?: string;
    subscriptionStatus?: string;
    featureFlags?: Partial<PlatformFeatureFlags>;
    usageLimitOverrides?: UsageLimitOverrides;
    whiteLabelEnabled?: boolean;
    adminNotes?: string;
    aiCallMinutes?: number;
    smsPerMonth?: number;
    emailsPerMonth?: number;
    workflowsActive?: number;
    aiAgents?: number;
    adAccounts?: number;
  },
): Promise<ServiceResult<{ ok: true }>> {
  const ctx = await requirePlatformAdmin();
  if (!ctx) return fail("Admin access required");

  const usageOverrides: UsageLimitOverrides = patch.usageLimitOverrides ?? {};
  if (patch.aiCallMinutes != null) usageOverrides.ai_call_minutes = patch.aiCallMinutes;
  if (patch.smsPerMonth != null) usageOverrides.sms_sent = patch.smsPerMonth;
  if (patch.emailsPerMonth != null) usageOverrides.email_sent = patch.emailsPerMonth;
  if (patch.workflowsActive != null) usageOverrides.workflows_active = patch.workflowsActive;
  if (patch.aiAgents != null) usageOverrides.ai_agents = patch.aiAgents;
  if (patch.adAccounts != null) usageOverrides.ad_accounts = patch.adAccounts;

  const result = await updatePlatformAccountAdmin(ctx.service, ctx.user.id, businessId, {
    status: patch.status,
    accountType: patch.accountType,
    planName: patch.planName,
    subscriptionStatus: patch.subscriptionStatus,
    featureFlags: patch.featureFlags,
    usageLimitOverrides:
      Object.keys(usageOverrides).length > 0 ? usageOverrides : patch.usageLimitOverrides,
    whiteLabelEnabled: patch.whiteLabelEnabled,
    adminNotes: patch.adminNotes,
  });

  if (result.success) {
    revalidatePath("/admin/accounts");
    revalidatePath(`/admin/accounts/${businessId}`);
    revalidatePath("/admin");
  }
  return result;
}

export async function linkSubAccountAdminAction(input: {
  agencyBusinessId: string;
  subBusinessId: string;
  label?: string;
}): Promise<ServiceResult<{ ok: true }>> {
  const ctx = await requirePlatformAdmin();
  if (!ctx) return fail("Admin access required");

  const result = await linkSubAccountToAgency(ctx.service, ctx.user.id, input);
  if (result.success) revalidatePath("/admin/accounts");
  return result;
}

export async function suspendAccountAdminAction(
  businessId: string,
  suspended: boolean,
): Promise<ServiceResult<{ ok: true }>> {
  return updateAccountAdminAction(businessId, {
    status: suspended ? "suspended" : "active",
  });
}

export async function approveAgencyAdminAction(businessId: string): Promise<ServiceResult<{ ok: true }>> {
  return updateAccountAdminAction(businessId, {
    status: "approved",
    accountType: "agency",
  });
}
