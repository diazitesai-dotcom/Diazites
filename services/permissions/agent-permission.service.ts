import type { SupabaseClient } from "@supabase/supabase-js";

import { ok, fail, type ServiceResult } from "@/lib/result";
import { createAgentPermissionRepository } from "@/repositories/agent-permission.repository";
import { createBusinessRepository } from "@/repositories/business.repository";
import { AGENT_PERMISSION_KEYS, type AgentPermissionKey } from "@/types/marketing-os";

import { writeAuditLog } from "@/services/audit/audit.service";

export async function listAgentPermissions(
  client: SupabaseClient,
  ownerUserId: string,
  businessId: string,
): Promise<ServiceResult<unknown[]>> {
  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(businessId);
  if (!business || business.user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  const repo = createAgentPermissionRepository(client);
  const { data, error } = await repo.listByBusiness(businessId);
  if (error) return fail(error.message);

  if ((data ?? []).length === 0) {
    return ok(
      AGENT_PERMISSION_KEYS.map((key) => ({
        permission_key: key,
        granted: key === "read_campaigns" || key === "pull_reports",
        requires_approval: key !== "read_campaigns" && key !== "pull_reports",
      })),
    );
  }

  return ok(data ?? []);
}

export async function updateAgentPermission(
  client: SupabaseClient,
  ownerUserId: string,
  businessId: string,
  input: {
    permissionKey: AgentPermissionKey;
    granted: boolean;
    requiresApproval?: boolean;
    agentId?: string | null;
    adAccountId?: string | null;
  },
): Promise<ServiceResult<unknown>> {
  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(businessId);
  if (!business || business.user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  const repo = createAgentPermissionRepository(client);
  const { data, error } = await repo.upsert({
    businessId,
    agentId: input.agentId,
    adAccountId: input.adAccountId,
    permissionKey: input.permissionKey,
    granted: input.granted,
    requiresApproval: input.requiresApproval,
  });

  if (error || !data) return fail(error?.message ?? "Update failed");

  await writeAuditLog(client, {
    businessId,
    actorUserId: ownerUserId,
    action: "agent_permission.updated",
    entityType: "agent_permission",
    entityId: data.id,
    metadata: { permissionKey: input.permissionKey, granted: input.granted },
  });

  return ok(data);
}

export async function seedDefaultAgentPermissions(
  client: SupabaseClient,
  businessId: string,
): Promise<void> {
  const repo = createAgentPermissionRepository(client);
  const { data } = await repo.listByBusiness(businessId);
  if ((data ?? []).length > 0) return;

  for (const key of AGENT_PERMISSION_KEYS) {
    const readOnly = key === "read_campaigns" || key === "pull_reports";
    await repo.upsert({
      businessId,
      permissionKey: key,
      granted: readOnly,
      requiresApproval: !readOnly,
    });
  }
}
