import type { SupabaseClient } from "@supabase/supabase-js";

import type { SystemEventType } from "@/types/backend";

export type AutomationActionType = "webhook" | "sms";

export type AutomationRuleRow = {
  id: string;
  business_id: string;
  name: string;
  trigger_event: string;
  enabled: boolean;
  action_type: AutomationActionType;
  action_config: Record<string, unknown>;
};

export function createAutomationRepository(client: SupabaseClient) {
  return {
    async listEnabledForTrigger(businessId: string, triggerEvent: SystemEventType | string) {
      return client
        .from("automation_rules")
        .select("*")
        .eq("business_id", businessId)
        .eq("trigger_event", triggerEvent)
        .eq("enabled", true);
    },

    async insertRun(input: {
      ruleId: string;
      businessId: string;
      eventType: string;
      status: "success" | "error" | "skipped";
      detail?: string | null;
      httpStatus?: number | null;
    }) {
      return client.from("automation_runs").insert({
        rule_id: input.ruleId,
        business_id: input.businessId,
        event_type: input.eventType,
        status: input.status,
        detail: input.detail ?? null,
        http_status: input.httpStatus ?? null,
      });
    },
  };
}
