import type { SupabaseClient } from "@supabase/supabase-js";

import {
  activeFeatureLabels,
  currentPeriodBounds,
  mergeFeatureFlags,
  mergedUsageLimits,
} from "@/lib/admin/platform-account-utils";
import { planMonthlyAmount } from "@/lib/billing/plans";
import { ok, fail, type ServiceResult } from "@/lib/result";
import { createPlatformAdminRepository } from "@/repositories/platform-admin.repository";
import type {
  PlatformAccountSettingsRow,
  PlatformAccountType,
  PlatformAccountView,
  PlatformAdminOverview,
  PlatformFeatureFlags,
  UsageLimitOverrides,
} from "@/types/platform-admin";
import { normalizePlanName } from "@/lib/billing/plans";

function inferAccountType(
  businessId: string,
  agencyByBusinessId: Map<string, { id: string; name: string }>,
  managedByBusinessId: Map<string, { agency_id: string; agencies?: { name: string; business_id: string } }>,
  settings?: PlatformAccountSettingsRow | null,
): PlatformAccountType {
  if (settings?.account_type) return settings.account_type;
  if (agencyByBusinessId.has(businessId)) return "agency";
  if (managedByBusinessId.has(businessId)) return "sub_account";
  return "direct";
}

export async function loadPlatformAccounts(
  client: SupabaseClient,
): Promise<{ accounts: PlatformAccountView[]; overview: PlatformAdminOverview }> {
  const repo = createPlatformAdminRepository(client);
  const period = currentPeriodBounds();
  const activitySince = new Date(Date.now() - 7 * 86400000).toISOString();

  const [
    businessesRes,
    billingRes,
    settingsRes,
    agenciesRes,
    managedRes,
    merchantRes,
    teamRes,
    usageRes,
    activityRes,
  ] = await Promise.all([
    repo.listAllBusinesses(),
    repo.listBilling(),
    repo.listAccountSettings(),
    repo.listAgencies(),
    repo.listManagedBusinesses(),
    repo.listMerchantAccounts(),
    repo.listTeamCounts(),
    repo.listUsageForCurrentMonth(period.start, period.end),
    repo.countAiActivitySince(activitySince),
  ]);

  const businesses = businessesRes.data ?? [];
  const ownerIds = [...new Set(businesses.map((b) => b.user_id))];
  const { data: users } = await repo.listUsersByIds(ownerIds);
  const emailByUser = new Map((users ?? []).map((u) => [u.id, u.email]));

  const billingByBiz = new Map((billingRes.data ?? []).map((b) => [b.business_id, b]));
  const settingsByBiz = new Map((settingsRes.data ?? []).map((s) => [s.business_id, s as PlatformAccountSettingsRow]));
  const agencyByBusinessId = new Map(
    (agenciesRes.data ?? []).map((a) => [a.business_id, { id: a.id, name: a.name }]),
  );
  const managedByBusinessId = new Map(
    (managedRes.data ?? []).map((m) => [m.business_id, m]),
  );
  const merchantByBiz = new Map((merchantRes.data ?? []).map((m) => [m.business_id, m.status]));
  const teamCountByBiz = new Map<string, number>();
  for (const t of teamRes.data ?? []) {
    teamCountByBiz.set(t.business_id, (teamCountByBiz.get(t.business_id) ?? 0) + 1);
  }
  const subCountByAgencyBiz = new Map<string, number>();
  for (const m of managedRes.data ?? []) {
    const agencyBizId = (m.agencies as { business_id?: string } | null)?.business_id;
    if (agencyBizId) {
      subCountByAgencyBiz.set(agencyBizId, (subCountByAgencyBiz.get(agencyBizId) ?? 0) + 1);
    }
  }
  const usageByBiz = new Map<string, Record<string, number>>();
  for (const u of usageRes.data ?? []) {
    const cur = usageByBiz.get(u.business_id) ?? {};
    cur[u.metric_key] = Number(u.quantity);
    usageByBiz.set(u.business_id, cur);
  }
  const activityCountByBiz = new Map<string, number>();
  for (const a of activityRes.data ?? []) {
    activityCountByBiz.set(a.business_id, (activityCountByBiz.get(a.business_id) ?? 0) + 1);
  }

  const accounts: PlatformAccountView[] = businesses.map((b) => {
    const settings = settingsByBiz.get(b.id);
    const billing = billingByBiz.get(b.id);
    const accountType = inferAccountType(b.id, agencyByBusinessId, managedByBusinessId, settings);
    const managed = managedByBusinessId.get(b.id);
    const agency = agencyByBusinessId.get(b.id);
    const planName = normalizePlanName(billing?.plan_name);
    const flags = mergeFeatureFlags(settings?.feature_flags);
    const overrides = (settings?.usage_limit_overrides ?? {}) as UsageLimitOverrides;
    const limits = mergedUsageLimits(planName, overrides);

    let parentBusinessId: string | null = settings?.parent_business_id ?? null;
    let parentAgencyName: string | null = null;
    if (managed) {
      const ag = managed.agencies as { name?: string; business_id?: string } | null;
      parentBusinessId = ag?.business_id ?? null;
      parentAgencyName = ag?.name ?? null;
    }

    return {
      businessId: b.id,
      businessName: b.name,
      ownerUserId: b.user_id,
      ownerEmail: emailByUser.get(b.user_id) ?? null,
      accountType,
      status: settings?.status ?? "active",
      parentBusinessId,
      parentAgencyName,
      agencyId: agency?.id ?? null,
      agencyName: agency?.name ?? null,
      subAccountCount: subCountByAgencyBiz.get(b.id) ?? 0,
      teamMemberCount: teamCountByBiz.get(b.id) ?? 0,
      planName,
      trialEndsAt: billing?.trial_ends_at ?? null,
      subscriptionStatus: billing?.subscription_status ?? billing?.payment_status ?? null,
      billingStatus: billing?.payment_status ?? null,
      promoCode: billing?.promo_code ?? null,
      merchantStatus: merchantByBiz.get(b.id) ?? null,
      featureFlags: flags,
      usageLimitOverrides: overrides,
      activeFeatures: activeFeatureLabels(flags),
      currentUsage: usageByBiz.get(b.id) ?? {},
      usageLimits: limits,
      whiteLabelEnabled: settings?.white_label_enabled ?? false,
      createdAt: b.created_at,
      lastLoginAt: settings?.last_login_at ?? null,
      recentAiActivityCount: activityCountByBiz.get(b.id) ?? 0,
    };
  });

  const overview: PlatformAdminOverview = {
    totalAccounts: accounts.length,
    agencies: accounts.filter((a) => a.accountType === "agency").length,
    subAccounts: accounts.filter((a) => a.accountType === "sub_account").length,
    directAccounts: accounts.filter((a) => a.accountType === "direct").length,
    activeTrials: accounts.filter((a) => a.subscriptionStatus === "trialing").length,
    suspended: accounts.filter((a) => a.status === "suspended").length,
    pendingApproval: accounts.filter((a) => a.status === "pending").length,
    merchantActive: accounts.filter((a) => a.merchantStatus === "active").length,
  };

  return { accounts, overview };
}

export async function registerAgencyAccount(
  client: SupabaseClient,
  actorUserId: string,
  input: { businessId: string; agencyName: string },
): Promise<ServiceResult<{ agencyId: string }>> {
  const repo = createPlatformAdminRepository(client);
  const { data: agency, error } = await repo.createAgencyRow({
    businessId: input.businessId,
    name: input.agencyName,
  });
  if (error || !agency) return fail(error?.message ?? "Failed to create agency");

  await repo.upsertAccountSettings({
    businessId: input.businessId,
    accountType: "agency",
    status: "approved",
    updatedBy: actorUserId,
  });

  await repo.logAdminAction({
    actorUserId,
    actionType: "agency_created",
    businessId: input.businessId,
    agencyId: agency.id,
    details: { name: input.agencyName },
  });

  return ok({ agencyId: agency.id });
}

export async function updatePlatformAccountAdmin(
  client: SupabaseClient,
  actorUserId: string,
  businessId: string,
  patch: {
    status?: PlatformAccountSettingsRow["status"];
    accountType?: PlatformAccountType;
    planName?: string;
    subscriptionStatus?: string;
    featureFlags?: Partial<PlatformFeatureFlags>;
    usageLimitOverrides?: UsageLimitOverrides;
    whiteLabelEnabled?: boolean;
    adminNotes?: string;
    parentBusinessId?: string | null;
  },
): Promise<ServiceResult<{ ok: true }>> {
  const repo = createPlatformAdminRepository(client);
  const { data: existing } = await repo.getAccountSettings(businessId);

  const flags = patch.featureFlags
    ? mergeFeatureFlags({ ...(existing?.feature_flags as object), ...patch.featureFlags })
    : undefined;

  const existingOverrides = (existing?.usage_limit_overrides ?? {}) as UsageLimitOverrides;
  const usageLimitOverrides = patch.usageLimitOverrides
    ? { ...existingOverrides, ...patch.usageLimitOverrides }
    : undefined;

  await repo.upsertAccountSettings({
    businessId,
    accountType: patch.accountType ?? existing?.account_type,
    status: patch.status ?? existing?.status ?? "active",
    parentBusinessId: patch.parentBusinessId ?? existing?.parent_business_id,
    featureFlags: flags,
    usageLimitOverrides,
    whiteLabelEnabled: patch.whiteLabelEnabled ?? existing?.white_label_enabled,
    adminNotes: patch.adminNotes ?? existing?.admin_notes,
    updatedBy: actorUserId,
  });

  if (patch.planName || patch.subscriptionStatus) {
    await repo.updateBillingPlan(businessId, {
      planName: patch.planName,
      subscriptionStatus: patch.subscriptionStatus,
      amount: patch.planName ? planMonthlyAmount(patch.planName) : undefined,
    });
  }

  await repo.logAdminAction({
    actorUserId,
    actionType: "account_updated",
    businessId,
    details: patch as Record<string, unknown>,
  });

  return ok({ ok: true });
}

export async function linkSubAccountToAgency(
  client: SupabaseClient,
  actorUserId: string,
  input: { agencyBusinessId: string; subBusinessId: string; label?: string },
): Promise<ServiceResult<{ ok: true }>> {
  const repo = createPlatformAdminRepository(client);
  const { data: agency } = await client
    .from("agencies")
    .select("id")
    .eq("business_id", input.agencyBusinessId)
    .maybeSingle();
  if (!agency) return fail("Agency not found for parent business");

  await repo.linkSubAccount({
    agencyId: agency.id,
    businessId: input.subBusinessId,
    label: input.label,
  });

  await repo.upsertAccountSettings({
    businessId: input.subBusinessId,
    accountType: "sub_account",
    parentBusinessId: input.agencyBusinessId,
    status: "active",
    updatedBy: actorUserId,
  });

  await repo.logAdminAction({
    actorUserId,
    actionType: "sub_account_linked",
    businessId: input.subBusinessId,
    agencyId: agency.id,
    details: input,
  });

  return ok({ ok: true });
}

export type PlatformAiActivityRow = {
  id: string;
  agent_key: string;
  action_type: string;
  entity_type: string | null;
  entity_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
};

export async function loadPlatformAccountDetail(
  client: SupabaseClient,
  businessId: string,
): Promise<{
  account: PlatformAccountView | null;
  aiActivity: PlatformAiActivityRow[];
}> {
  const { accounts } = await loadPlatformAccounts(client);
  const account = accounts.find((a) => a.businessId === businessId) ?? null;
  const repo = createPlatformAdminRepository(client);
  const { data: aiActivity } = await repo.listAiActivityForBusiness(businessId);
  return {
    account,
    aiActivity: (aiActivity ?? []) as PlatformAiActivityRow[],
  };
}
