import type { SupabaseClient } from "@supabase/supabase-js";

import {
  PLAN_ENTITLEMENT_CATALOG,
  billingToEntitlementPlan,
} from "@/lib/entitlements/plan-catalog";
import { showUpgradeRequired } from "@/lib/entitlements/upgrade-messages";
import { ok, fail, type ServiceResult } from "@/lib/result";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { createBillingRepository } from "@/repositories/billing.repository";
import {
  createAccountEntitlementsRepository,
  rowsToEntitlementsMap,
} from "@/repositories/account-entitlements.repository";
import type {
  AccountEntitlementsMap,
  EntitlementKey,
  EntitlementPlanKey,
  UpgradePromptContext,
} from "@/types/entitlements";

export type AccountEntitlementContext = {
  businessId: string;
  planKey: EntitlementPlanKey;
  entitlements: AccountEntitlementsMap;
};

function currentPeriodStart(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function catalogForPlan(planKey: EntitlementPlanKey): AccountEntitlementsMap {
  const template = PLAN_ENTITLEMENT_CATALOG[planKey] ?? PLAN_ENTITLEMENT_CATALOG.starter;
  return { ...template };
}

function getEntitlementValue(
  map: AccountEntitlementsMap,
  key: EntitlementKey,
): { bool: boolean; int: number | null } {
  const v = map[key];
  if (v?.bool !== undefined) return { bool: v.bool, int: v.int ?? null };
  if (v?.int !== undefined) return { bool: true, int: v.int };
  return { bool: false, int: null };
}

function isUnlimited(limit: number | null): boolean {
  return limit === null;
}

export async function getAccountPlan(
  client: SupabaseClient,
  businessId: string,
): Promise<EntitlementPlanKey> {
  const billing = createBillingRepository(client);
  const { data: row } = await billing.getByBusinessId(businessId);
  const repo = createAccountEntitlementsRepository(client);
  const { data: biz } = await repo.getBusinessPlanKey(businessId);
  const stored = biz?.entitlement_plan_key as EntitlementPlanKey | undefined;
  if (stored && stored in PLAN_ENTITLEMENT_CATALOG) return stored;
  return billingToEntitlementPlan(
    row?.plan_name ?? "Starter",
    row?.subscription_status ?? row?.payment_status,
  );
}

export async function refreshAccountEntitlements(
  client: SupabaseClient,
  businessId: string,
  planKey?: EntitlementPlanKey,
): Promise<ServiceResult<void>> {
  const plan = planKey ?? (await getAccountPlan(client, businessId));
  const repo = createAccountEntitlementsRepository(client);
  const { error } = await repo.refreshFromPlan(businessId, plan);
  if (error) {
    try {
      const service = createServiceRoleClient();
      await createAccountEntitlementsRepository(service).refreshFromPlan(businessId, plan);
    } catch {
      return fail(error.message, "ENTITLEMENTS_REFRESH_FAILED");
    }
  }
  return ok(undefined);
}

export async function getEntitlements(
  client: SupabaseClient,
  businessId: string,
): Promise<ServiceResult<AccountEntitlementContext>> {
  const planKey = await getAccountPlan(client, businessId);
  const repo = createAccountEntitlementsRepository(client);
  const { data: rows, error } = await repo.listForBusiness(businessId);

  if (error || !rows?.length) {
    return ok({
      businessId,
      planKey,
      entitlements: catalogForPlan(planKey),
    });
  }

  const fromDb = rowsToEntitlementsMap(rows as Parameters<typeof rowsToEntitlementsMap>[0]);
  const merged = { ...catalogForPlan(planKey), ...fromDb };

  return ok({ businessId, planKey, entitlements: merged });
}

export function canUseFeature(
  ctx: AccountEntitlementContext,
  featureKey: EntitlementKey,
): boolean {
  const { bool } = getEntitlementValue(ctx.entitlements, featureKey);
  return bool;
}

export async function getUsage(
  client: SupabaseClient,
  businessId: string,
  featureKey: string,
): Promise<number> {
  const repo = createAccountEntitlementsRepository(client);
  const { data } = await repo.getUsage(businessId, featureKey, currentPeriodStart());
  return Number(data?.quantity ?? 0);
}

export async function incrementUsage(
  client: SupabaseClient,
  businessId: string,
  featureKey: string,
  delta = 1,
): Promise<void> {
  const repo = createAccountEntitlementsRepository(client);
  await repo.incrementUsage(businessId, featureKey, currentPeriodStart(), delta);
}

export function canUseFeatureWithinLimit(
  ctx: AccountEntitlementContext,
  limitKey: EntitlementKey,
  used: number,
  requested = 1,
): boolean {
  const { int: limit } = getEntitlementValue(ctx.entitlements, limitKey);
  if (isUnlimited(limit)) return true;
  if (limit === null) return false;
  return used + requested <= limit;
}

export function canActivateAgent(
  ctx: AccountEntitlementContext,
  agentKey: string,
): boolean {
  const map: Record<string, EntitlementKey> = {
    lead_capture: "lead_capture_agent_lite",
    crm: "crm_agent_lite",
    follow_up: "follow_up_agent_lite",
    ads: "ads_agent_lite",
    ads_lite: "ads_agent_lite",
    ads_full: "ads_agent_full",
    ai_voice: "ai_voice_lite",
  };
  const key = map[agentKey] ?? "ads_agent_full";
  return canUseFeature(ctx, key);
}

export async function canConnectAdAccount(
  client: SupabaseClient,
  ctx: AccountEntitlementContext,
  _platform: "meta" | "google",
  connectedCount: number,
): Promise<{ allowed: boolean; upgrade?: UpgradePromptContext }> {
  const { int: limit } = getEntitlementValue(ctx.entitlements, "ad_accounts");
  if (isUnlimited(limit)) return { allowed: true };
  if (connectedCount >= (limit ?? 0)) {
    return { allowed: false, upgrade: showUpgradeRequired("ad_accounts") };
  }
  return { allowed: true };
}

export async function canUseAiVoice(
  ctx: AccountEntitlementContext,
  minutesRequested: number,
  usedMinutes: number,
): Promise<{ allowed: boolean; upgrade?: UpgradePromptContext }> {
  if (!canUseFeature(ctx, "ai_voice_lite")) {
    return { allowed: false, upgrade: showUpgradeRequired("ai_voice_minutes") };
  }
  const within = canUseFeatureWithinLimit(
    ctx,
    "ai_voice_minutes",
    usedMinutes,
    minutesRequested,
  );
  if (!within) {
    return { allowed: false, upgrade: showUpgradeRequired("ai_voice_minutes") };
  }
  return { allowed: true };
}

export { showUpgradeRequired };
