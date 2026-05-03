import type { SupabaseClient } from "@supabase/supabase-js";

import { ok, fail, type ServiceResult } from "@/lib/result";
import { createAgentRepository } from "@/repositories/agent.repository";
import { createBusinessRepository } from "@/repositories/business.repository";
import { EVENT_TYPES } from "@/types/backend";
import type { AgentType } from "@/types/domain";

import { sendSystemNotification } from "@/services/email/email.service";
import { triggerEvent } from "@/services/events/event-dispatcher";

export async function activateAgent(
  client: SupabaseClient,
  userId: string,
  agentType: AgentType,
): Promise<ServiceResult<{ agentId: string }>> {
  const businesses = createBusinessRepository(client);
  const agents = createAgentRepository(client);

  const { data: business } = await businesses.getByOwnerUserId(userId);
  if (!business) {
    return fail("Complete business setup first", "NO_BUSINESS");
  }

  const { data, error } = await agents.upsertActivation({
    businessId: business.id,
    agentType,
    status: "pending",
    activatedAt: new Date().toISOString(),
  });

  if (error || !data) {
    return fail(error?.message ?? "Agent activation failed", "AGENT_UPSERT_FAILED");
  }

  await triggerEvent(client, {
    type: EVENT_TYPES.AGENT_ACTIVATED,
    businessId: business.id,
    payload: { agentType, agentRowId: data.id },
  });

  await sendSystemNotification({
    subject: `[Diazites] Agent activation requested — ${agentType}`,
    text: `Business ${business.name} (${business.id}) requested activation for ${agentType}.`,
  });

  return ok({ agentId: data.id });
}

export async function getUserAgents(client: SupabaseClient, userId: string) {
  const businesses = createBusinessRepository(client);
  const agents = createAgentRepository(client);

  const { data: business } = await businesses.getByOwnerUserId(userId);
  if (!business) {
    return ok([] as unknown[]);
  }

  const { data, error } = await agents.listByBusiness(business.id);
  if (error) return fail(error.message);
  return ok(data ?? []);
}

export async function updateAgentStatus(
  client: SupabaseClient,
  businessId: string,
  agentType: AgentType,
  status: "inactive" | "pending" | "active",
  actorUserId: string,
): Promise<ServiceResult<unknown>> {
  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(businessId);
  if (!business || business.owner_user_id !== actorUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  const agents = createAgentRepository(client);
  const { data, error } = await agents.updateStatus(businessId, agentType, status);
  if (error || !data) return fail(error?.message ?? "Update failed");

  await triggerEvent(client, {
    type: EVENT_TYPES.AGENT_STATUS_CHANGED,
    businessId,
    payload: { agentType, status },
  });

  return ok(data);
}
