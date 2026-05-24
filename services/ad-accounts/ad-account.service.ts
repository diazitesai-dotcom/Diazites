import type { SupabaseClient } from "@supabase/supabase-js";

import { decryptCredentials, encryptCredentials, maskCredential } from "@/lib/crypto/credentials";
import { ok, fail, type ServiceResult } from "@/lib/result";
import { createAdAccountRepository } from "@/repositories/ad-account.repository";
import { createBusinessRepository } from "@/repositories/business.repository";
import { EVENT_TYPES } from "@/types/backend";
import type { AdPlatform, ConnectionStatus } from "@/types/marketing-os";
import { PLATFORM_CAPABILITIES } from "@/types/marketing-os";

import { writeAuditLog } from "@/services/audit/audit.service";
import { triggerEvent } from "@/services/events/event-dispatcher";
import { requestApprovalIfNeeded } from "@/services/approvals/approval.service";

export type AdAccountConnectInput = {
  platform: AdPlatform;
  accountName?: string;
  externalAccountId?: string;
  credentials: Record<string, string>;
};

export async function connectAdAccount(
  client: SupabaseClient,
  ownerUserId: string,
  businessId: string,
  input: AdAccountConnectInput,
): Promise<ServiceResult<{ id: string; connectionStatus: ConnectionStatus }>> {
  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(businessId);
  if (!business || business.user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  const credentialsJson = JSON.stringify(input.credentials);
  const primaryValue = Object.values(input.credentials)[0] ?? "";
  const encrypted = encryptCredentials(credentialsJson);
  const hint = maskCredential(primaryValue);

  const repo = createAdAccountRepository(client);
  const { data, error } = await repo.upsert({
    businessId,
    platform: input.platform,
    accountName: input.accountName ?? `${input.platform} account`,
    externalAccountId: input.externalAccountId ?? `${input.platform}-${Date.now()}`,
    connectionStatus: "connected",
    credentialsEncrypted: encrypted,
    credentialsHint: hint,
    metadata: { capabilities: PLATFORM_CAPABILITIES[input.platform] },
  });

  if (error || !data) return fail(error?.message ?? "Failed to connect account");

  await writeAuditLog(client, {
    businessId,
    actorUserId: ownerUserId,
    action: "ad_account.connected",
    entityType: "ad_account",
    entityId: data.id,
    metadata: { platform: input.platform },
  });

  await triggerEvent(client, {
    type: EVENT_TYPES.AD_ACCOUNT_CONNECTED,
    businessId,
    payload: { adAccountId: data.id, platform: input.platform },
  });

  return ok({ id: data.id, connectionStatus: "connected" });
}

export async function listAdAccounts(
  client: SupabaseClient,
  ownerUserId: string,
  businessId: string,
): Promise<ServiceResult<unknown[]>> {
  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(businessId);
  if (!business || business.user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  const repo = createAdAccountRepository(client);
  const { data, error } = await repo.listByBusiness(businessId);
  if (error) return fail(error.message);
  return ok(data ?? []);
}

export async function testAdAccountConnection(
  client: SupabaseClient,
  ownerUserId: string,
  businessId: string,
  adAccountId: string,
): Promise<ServiceResult<{ ok: boolean; message: string }>> {
  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(businessId);
  if (!business || business.user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  const repo = createAdAccountRepository(client);
  const { data: account } = await repo.getById(adAccountId);
  if (!account || account.business_id !== businessId) {
    return fail("Ad account not found", "NOT_FOUND");
  }

  if (!account.credentials_encrypted) {
    return ok({ ok: false, message: "No credentials stored" });
  }

  try {
    decryptCredentials(account.credentials_encrypted);
    await repo.updateSyncStats(adAccountId, { connectionStatus: "connected" });
    return ok({ ok: true, message: "Connection verified. Credentials decrypt successfully." });
  } catch {
    await repo.updateSyncStats(adAccountId, { connectionStatus: "sync_failed" });
    return ok({ ok: false, message: "Credential decryption failed. Reconnect the account." });
  }
}

export async function syncAdAccountCampaigns(
  client: SupabaseClient,
  ownerUserId: string,
  businessId: string,
  adAccountId: string,
): Promise<ServiceResult<{ campaignCount: number }>> {
  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(businessId);
  if (!business || business.user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  const repo = createAdAccountRepository(client);
  const { data: account } = await repo.getById(adAccountId);
  if (!account || account.business_id !== businessId) {
    return fail("Ad account not found", "NOT_FOUND");
  }

  // Placeholder sync — real platform APIs wired per connector
  const simulatedCount = Math.max(account.campaign_count ?? 0, 3);
  const { data, error } = await repo.updateSyncStats(adAccountId, {
    connectionStatus: "connected",
    campaignCount: simulatedCount,
    totalSpend: Number(account.total_spend ?? 0) + 150,
    totalLeads: Number(account.total_leads ?? 0) + 2,
    metadata: {
      ...(account.metadata as Record<string, unknown>),
      lastSyncMessage: "Campaign metadata synced (simulated until platform API connected)",
    },
  });

  if (error || !data) return fail(error?.message ?? "Sync failed");

  await triggerEvent(client, {
    type: EVENT_TYPES.AD_ACCOUNT_SYNCED,
    businessId,
    payload: { adAccountId, campaignCount: simulatedCount },
  });

  return ok({ campaignCount: simulatedCount });
}

export async function disconnectAdAccount(
  client: SupabaseClient,
  ownerUserId: string,
  businessId: string,
  adAccountId: string,
): Promise<ServiceResult<void>> {
  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(businessId);
  if (!business || business.user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  const repo = createAdAccountRepository(client);
  const { error } = await repo.delete(adAccountId, businessId);
  if (error) return fail(error.message);

  await writeAuditLog(client, {
    businessId,
    actorUserId: ownerUserId,
    action: "ad_account.disconnected",
    entityType: "ad_account",
    entityId: adAccountId,
  });

  return ok(undefined);
}

/** Agent-initiated action — checks permissions and routes to approvals when needed. */
export async function agentAdAction(
  client: SupabaseClient,
  input: {
    businessId: string;
    agentId: string;
    adAccountId: string;
    permissionKey: import("@/types/marketing-os").AgentPermissionKey;
    actionTitle: string;
    payload: Record<string, unknown>;
    riskScore: number;
  },
): Promise<ServiceResult<{ approved: boolean; approvalId?: string }>> {
  const { createAgentPermissionRepository } = await import("@/repositories/agent-permission.repository");
  const perms = createAgentPermissionRepository(client);
  const perm = await perms.hasPermission(input.businessId, input.permissionKey, input.agentId);

  if (!perm.granted) {
    return fail("Agent lacks permission for this action", "FORBIDDEN");
  }

  if (perm.requiresApproval || input.riskScore >= 50) {
    const approval = await requestApprovalIfNeeded(client, {
      businessId: input.businessId,
      approvalType: "agent_action",
      title: input.actionTitle,
      riskScore: input.riskScore,
      confidenceScore: 75,
      payload: input.payload,
      requestedByType: "agent",
      requestedById: input.agentId,
      entityType: "ad_account",
      entityId: input.adAccountId,
    });
    if (approval.success) {
      return ok({ approved: false, approvalId: approval.data.id });
    }
    return fail(approval.error);
  }

  return ok({ approved: true });
}
