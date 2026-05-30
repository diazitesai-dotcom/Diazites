import type { SupabaseClient } from "@supabase/supabase-js";

import { EVENT_TYPES } from "@/types/backend";

import { triggerEvent } from "@/services/events/event-dispatcher";

export async function logAgentActivity(
  client: SupabaseClient,
  input: {
    businessId: string;
    agentKey: string;
    actionType: string;
    entityType?: string;
    entityId?: string;
    payload?: Record<string, unknown>;
  },
): Promise<void> {
  await client.from("agent_activity_logs").insert({
    business_id: input.businessId,
    agent_key: input.agentKey,
    action_type: input.actionType,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    payload: input.payload ?? {},
  });

  await triggerEvent(client, {
    type: EVENT_TYPES.AGENT_ACTIVITY,
    businessId: input.businessId,
    payload: {
      agentKey: input.agentKey,
      actionType: input.actionType,
      ...(input.payload ?? {}),
    },
  });
}

export function formatAgentActivityTitle(agentKey: string, actionType: string): string {
  const agentLabels: Record<string, string> = {
    sales: "Sales Agent",
    follow_up: "Follow-Up Agent",
    crm: "CRM Agent",
    billing: "Billing Agent",
    workflow: "Workflow Agent",
    calling: "AI Caller",
    email: "Email Agent",
    sms: "Text Agent",
    funnel: "Landing Agent",
    ads: "Ad Agent",
  };
  const label = agentLabels[agentKey] ?? `${agentKey} agent`;
  return `${label} ${actionType.replace(/_/g, " ")}`;
}
