import type { SupabaseClient } from "@supabase/supabase-js";

import { createSystemEventRepository } from "@/repositories/system-event.repository";
import { EVENT_TYPES, type SystemEventType } from "@/types/backend";

import { runLeadCreatedAutomation } from "@/services/leads/lead-automation.service";

export type TriggerEventParams = {
  type: SystemEventType;
  businessId: string;
  leadId?: string;
  payload?: Record<string, unknown>;
};

/**
 * Persists a domain event and runs registered automations (same Supabase client as caller).
 */
export async function triggerEvent(
  client: SupabaseClient,
  params: TriggerEventParams,
): Promise<void> {
  try {
    const events = createSystemEventRepository(client);
    const { error } = await events.insert({
      businessId: params.businessId,
      leadId: params.leadId,
      eventType: params.type,
      payload: {
        ...params.payload,
        emittedAt: new Date().toISOString(),
      },
    });

    if (error) {
      console.error("[triggerEvent] persist failed", error);
    }
  } catch (e) {
    console.error("[triggerEvent] system_events unavailable — apply migration 002?", e);
  }

  if (params.type === EVENT_TYPES.LEAD_CREATED && params.leadId) {
    await runLeadCreatedAutomation(client, params.businessId, params.leadId);
  }
}
