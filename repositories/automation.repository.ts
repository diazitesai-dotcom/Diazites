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

    async listForBusiness(businessId: string) {
      return client
        .from("automation_rules")
        .select("*")
        .eq("business_id", businessId)
        .order("name", { ascending: true });
    },

    async listForBusinessRaw(businessId: string) {
      const res = await client
        .from("automation_rules")
        .select("*")
        .eq("business_id", businessId)
        .order("name", { ascending: true });
      return (res.data ?? []) as AutomationRuleRow[];
    },

    async create(input: {
      businessId: string;
      name: string;
      triggerEvent: string;
      actionType: AutomationActionType;
      actionConfig: Record<string, unknown>;
      enabled?: boolean;
    }) {
      return client
        .from("automation_rules")
        .insert({
          business_id: input.businessId,
          name: input.name,
          trigger_event: input.triggerEvent,
          action_type: input.actionType,
          action_config: input.actionConfig,
          enabled: input.enabled ?? true,
        })
        .select("*")
        .single();
    },

    async toggle(id: string, enabled: boolean) {
      return client
        .from("automation_rules")
        .update({ enabled })
        .eq("id", id)
        .select("*")
        .single();
    },

    async remove(id: string) {
      return client.from("automation_rules").delete().eq("id", id);
    },

    async listRecentRuns(businessId: string, limit = 30) {
      return client
        .from("automation_runs")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(limit);
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
