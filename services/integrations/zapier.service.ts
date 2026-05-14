import type { SupabaseClient } from "@supabase/supabase-js";

import { fail, ok, type ServiceResult } from "@/lib/result";
import {
  createAutomationRepository,
  type AutomationRuleRow,
} from "@/repositories/automation.repository";
import { EVENT_TYPES, type SystemEventType } from "@/types/backend";

/**
 * Events that the Zapier connector can subscribe to. Each maps 1:1 to a row in
 * `automation_rules` with action_type="webhook" and action_config.source="zapier".
 * Order matters for UI rendering.
 */
export const ZAPIER_SUBSCRIBABLE_EVENTS: ReadonlyArray<{
  type: SystemEventType;
  label: string;
  description: string;
}> = [
  {
    type: EVENT_TYPES.LEAD_CREATED,
    label: "New lead captured",
    description: "Fires every time a lead is submitted via a landing page or API.",
  },
  {
    type: EVENT_TYPES.LEAD_STATUS_CHANGED,
    label: "Lead stage changed",
    description: "Fires when a lead moves between pipeline stages (new → contacted → booked → etc.).",
  },
  {
    type: EVENT_TYPES.ENGINE_LAUNCHED,
    label: "Engine launched",
    description: "Fires when an engine run goes live and publishes a landing page.",
  },
  {
    type: EVENT_TYPES.ENGINE_QA_FAILED,
    label: "Engine launch QA failed",
    description: "Fires when an engine run's launch QA checks did not pass.",
  },
  {
    type: EVENT_TYPES.AD_CAMPAIGN_PUSHED,
    label: "Ad campaign pushed",
    description: "Fires when a winning creative is pushed to an ad platform.",
  },
];

const ZAPIER_SOURCE = "zapier" as const;

export type ZapierRule = AutomationRuleRow & {
  zapierUrl: string;
  isZapier: true;
};

export function isZapierRule(rule: AutomationRuleRow): rule is ZapierRule {
  const cfg = rule.action_config as { source?: unknown; url?: unknown } | null;
  return (
    rule.action_type === "webhook" &&
    typeof cfg?.url === "string" &&
    cfg?.source === ZAPIER_SOURCE
  );
}

export function zapierUrlFromRule(rule: AutomationRuleRow): string | null {
  const cfg = rule.action_config as { url?: unknown } | null;
  return typeof cfg?.url === "string" ? cfg.url : null;
}

export function isValidZapierWebhook(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    return (
      parsed.hostname === "hooks.zapier.com" ||
      parsed.hostname.endsWith(".hooks.zapier.com") ||
      parsed.hostname === "hooks.zapier.app"
    );
  } catch {
    return false;
  }
}

/**
 * Subscribe Zapier to N events for a business. Creates one automation_rule per
 * event (so the user can toggle them independently from the Automations page).
 */
export async function subscribeZapier(
  client: SupabaseClient,
  input: {
    businessId: string;
    name: string;
    url: string;
    events: SystemEventType[];
  },
): Promise<ServiceResult<{ created: number }>> {
  if (!isValidZapierWebhook(input.url)) {
    return fail(
      "Zapier webhook URL must be an https://hooks.zapier.com/... URL",
      "invalid_url",
    );
  }
  if (input.events.length === 0) {
    return fail("Select at least one event to subscribe to", "no_events");
  }

  const automation = createAutomationRepository(client);

  let created = 0;
  for (const event of input.events) {
    const { error } = await automation.create({
      businessId: input.businessId,
      name: `${input.name} · ${friendlyEvent(event)}`,
      triggerEvent: event,
      actionType: "webhook",
      actionConfig: {
        source: ZAPIER_SOURCE,
        url: input.url,
        method: "POST",
      },
      enabled: true,
    });
    if (!error) created += 1;
  }

  if (created === 0) {
    return fail("Failed to create any Zapier subscriptions");
  }
  return ok({ created });
}

/**
 * Fire-and-forget GET/POST to the Zapier webhook URL with a sample payload, so
 * users can pull the test event into the Zapier UI when wiring a new Zap.
 */
export async function testZapierWebhook(
  url: string,
  samplePayload?: Record<string, unknown>,
): Promise<ServiceResult<{ httpStatus: number }>> {
  if (!isValidZapierWebhook(url)) {
    return fail("Invalid Zapier webhook URL", "invalid_url");
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        samplePayload ?? {
          event: "ZAPIER_TEST",
          businessId: "test-business",
          payload: {
            note: "This is a test fired from Diazites to verify your Zap connection.",
            firedAt: new Date().toISOString(),
          },
        },
      ),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return fail(
        `Zapier returned ${res.status}${body ? `: ${body.slice(0, 200)}` : ""}`,
        "http_error",
      );
    }
    return ok({ httpStatus: res.status });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "fetch failed", "fetch_failed");
  }
}

export async function listZapierRulesForBusiness(
  client: SupabaseClient,
  businessId: string,
): Promise<ServiceResult<ZapierRule[]>> {
  const automation = createAutomationRepository(client);
  const { data, error } = await automation.listForBusiness(businessId);
  if (error) return fail(error.message);
  const rules = ((data ?? []) as AutomationRuleRow[])
    .filter(isZapierRule)
    .map((r) => ({ ...r, zapierUrl: zapierUrlFromRule(r) ?? "", isZapier: true as const }));
  return ok(rules);
}

function friendlyEvent(type: SystemEventType): string {
  return ZAPIER_SUBSCRIBABLE_EVENTS.find((e) => e.type === type)?.label ?? type;
}
