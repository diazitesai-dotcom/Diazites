import type { SupabaseClient } from "@supabase/supabase-js";

import {
  createAutomationRepository,
  type AutomationRuleRow,
} from "@/repositories/automation.repository";
import { sendSms } from "@/services/sms/sms.service";
import type { SystemEventType } from "@/types/backend";

function interpolate(template: string, ctx: Record<string, unknown>): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path: string) => {
    const parts = path.split(".");
    let cur: unknown = ctx;
    for (const p of parts) {
      if (cur && typeof cur === "object" && p in (cur as object)) {
        cur = (cur as Record<string, unknown>)[p];
      } else {
        return "";
      }
    }
    return cur != null ? String(cur) : "";
  });
}

async function buildDispatchContext(
  client: SupabaseClient,
  params: {
    type: SystemEventType;
    businessId: string;
    leadId?: string;
    payload?: Record<string, unknown>;
  },
): Promise<Record<string, unknown>> {
  const base: Record<string, unknown> = {
    event: params.type,
    businessId: params.businessId,
    leadId: params.leadId,
    payload: params.payload ?? {},
  };

  if (params.leadId) {
    const { data: lead } = await client
      .from("leads")
      .select("id, name, phone, email, source, status, notes")
      .eq("id", params.leadId)
      .maybeSingle();
    if (lead) {
      base.lead = lead;
    }
  }

  return base;
}

async function runWebhookRule(
  rule: AutomationRuleRow,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; status?: number; detail?: string }> {
  const cfg = rule.action_config as {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
  };
  const url = cfg.url?.trim();
  if (!url) {
    return { ok: false, detail: "missing url" };
  }
  try {
    const res = await fetch(url, {
      method: (cfg.method ?? "POST").toUpperCase(),
      headers: {
        "Content-Type": "application/json",
        ...(cfg.headers ?? {}),
      },
      body: JSON.stringify(body),
    });
    return { ok: res.ok, status: res.status, detail: res.ok ? undefined : await res.text() };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : "fetch failed" };
  }
}

async function runSmsRule(
  rule: AutomationRuleRow,
  ctx: Record<string, unknown>,
): Promise<{ ok: boolean; detail?: string }> {
  const cfg = rule.action_config as {
    to?: string;
    bodyTemplate?: string;
  };
  const to = interpolate(cfg.to ?? "", ctx);
  const body = interpolate(cfg.bodyTemplate ?? "", ctx);
  if (!to) {
    return { ok: false, detail: "missing to" };
  }
  return sendSms({ to, body });
}

/**
 * Executes enabled automation rules for the given domain event (webhooks, SMS).
 */
export async function dispatchAutomationRules(
  client: SupabaseClient,
  params: {
    type: SystemEventType;
    businessId: string;
    leadId?: string;
    payload?: Record<string, unknown>;
  },
): Promise<void> {
  const automation = createAutomationRepository(client);
  const { data: rules, error } = await automation.listEnabledForTrigger(
    params.businessId,
    params.type,
  );

  if (error) {
    console.error("[automation] list rules failed", error);
    return;
  }
  if (!rules?.length) return;

  const ctx = await buildDispatchContext(client, params);
  const webhookPayload = ctx;

  for (const raw of rules) {
    const rule = raw as AutomationRuleRow;
    try {
      if (rule.action_type === "webhook") {
        const result = await runWebhookRule(rule, webhookPayload);
        await automation.insertRun({
          ruleId: rule.id,
          businessId: params.businessId,
          eventType: params.type,
          status: result.ok ? "success" : "error",
          detail: result.detail?.slice(0, 2000) ?? null,
          httpStatus: result.status ?? null,
        });
      } else if (rule.action_type === "sms") {
        const result = await runSmsRule(rule, ctx);
        await automation.insertRun({
          ruleId: rule.id,
          businessId: params.businessId,
          eventType: params.type,
          status: result.ok ? "success" : "error",
          detail: result.detail?.slice(0, 2000) ?? null,
        });
      } else {
        await automation.insertRun({
          ruleId: rule.id,
          businessId: params.businessId,
          eventType: params.type,
          status: "skipped",
          detail: "unknown action_type",
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "rule failed";
      await automation.insertRun({
        ruleId: rule.id,
        businessId: params.businessId,
        eventType: params.type,
        status: "error",
        detail: msg,
      });
    }
  }
}
