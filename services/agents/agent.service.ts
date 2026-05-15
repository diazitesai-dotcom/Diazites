import type { SupabaseClient } from "@supabase/supabase-js";

import { ok, fail, type ServiceResult } from "@/lib/result";
import { createAgentRepository } from "@/repositories/agent.repository";
import { createAutomationRepository } from "@/repositories/automation.repository";
import { createBusinessRepository } from "@/repositories/business.repository";
import { EVENT_TYPES } from "@/types/backend";
import type { AgentType } from "@/types/domain";

import { AGENT_PLAYBOOKS } from "@/services/agents/agent-playbooks";
import { sendSystemNotification } from "@/services/email/email.service";
import { triggerEvent } from "@/services/events/event-dispatcher";

export async function activateAgent(
  client: SupabaseClient,
  userId: string,
  agentType: AgentType,
): Promise<ServiceResult<{ agentId: string; rulesCreated: number }>> {
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

  const playbook = AGENT_PLAYBOOKS[agentType];
  const automations = createAutomationRepository(client);
  const { data: existingRules } = await automations.listForBusiness(business.id);
  const agentSourcePrefix = `agent:${agentType}`;

  for (const rule of existingRules ?? []) {
    const cfg = rule.action_config as { source?: string };
    if (cfg.source === agentSourcePrefix || cfg.source?.startsWith(`${agentSourcePrefix}:`)) {
      await automations.remove(rule.id);
    }
  }

  for (const rule of playbook.rules) {
    await automations.create({
      businessId: business.id,
      name: rule.name,
      triggerEvent: rule.triggerEvent,
      actionType: rule.actionType,
      actionConfig: { ...rule.actionConfig, source: agentSourcePrefix },
      enabled: rule.enabled,
    });
  }

  await agents.updateStatus(business.id, agentType, "active");

  await triggerEvent(client, {
    type: EVENT_TYPES.AGENT_ACTIVATED,
    businessId: business.id,
    payload: { agentType, agentRowId: data.id },
  });

  await sendSystemNotification({
    subject: `[Diazites] Agent activation requested — ${agentType}`,
    text: `Business ${business.name} (${business.id}) requested activation for ${agentType}.`,
  });

  return ok({ agentId: data.id, rulesCreated: playbook.rules.length });
}

export async function deactivateAgent(
  client: SupabaseClient,
  userId: string,
  agentType: AgentType,
): Promise<ServiceResult<void>> {
  const businesses = createBusinessRepository(client);
  const agents = createAgentRepository(client);

  const { data: business } = await businesses.getByOwnerUserId(userId);
  if (!business) {
    return fail("Complete business setup first", "NO_BUSINESS");
  }

  await agents.updateStatus(business.id, agentType, "inactive");

  const automations = createAutomationRepository(client);
  const { data: existingRules } = await automations.listForBusiness(business.id);
  const agentSourcePrefix = `agent:${agentType}`;

  for (const rule of existingRules ?? []) {
    const cfg = rule.action_config as { source?: string };
    if (cfg.source === agentSourcePrefix || cfg.source?.startsWith(`${agentSourcePrefix}:`)) {
      await automations.toggle(rule.id, false);
    }
  }

  await triggerEvent(client, {
    type: EVENT_TYPES.AGENT_STATUS_CHANGED,
    businessId: business.id,
    payload: { agentType, status: "inactive" },
  });

  return ok(undefined);
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
  if (!business || business.user_id !== actorUserId) {
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
