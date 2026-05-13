"use server";

import { revalidatePath } from "next/cache";

import { logAudit } from "@/lib/audit/log";
import { requireAuth } from "@/lib/auth/session";
import { fail, ok, type ServiceResult } from "@/lib/result";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  type AutomationActionType,
  createAutomationRepository,
} from "@/repositories/automation.repository";
import { createBusinessRepository } from "@/repositories/business.repository";
import { EVENT_TYPES, type SystemEventType } from "@/types/backend";

const TRIGGER_OPTIONS = Object.values(EVENT_TYPES) as ReadonlyArray<SystemEventType>;

async function resolveContext() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business) return null;
  return { supabase, userId: user.id, businessId: business.id };
}

export async function createAutomationRuleAction(
  formData: FormData,
): Promise<ServiceResult<{ id: string }>> {
  const ctx = await resolveContext();
  if (!ctx) return fail("No business found");

  const name = pick(formData, "name");
  const triggerEvent = pick(formData, "trigger_event");
  const actionType = pick(formData, "action_type") as AutomationActionType | undefined;
  const target = pick(formData, "target");

  if (!name) return fail("Name is required");
  if (!triggerEvent || !TRIGGER_OPTIONS.includes(triggerEvent as SystemEventType)) {
    return fail("Choose a valid trigger event");
  }
  if (actionType !== "webhook" && actionType !== "sms") {
    return fail("Action type must be webhook or sms");
  }
  if (!target) return fail("Provide a target URL (webhook) or phone number (sms)");

  const actionConfig: Record<string, unknown> =
    actionType === "webhook" ? { url: target } : { to: target };

  const repo = createAutomationRepository(ctx.supabase);
  const { data, error } = await repo.create({
    businessId: ctx.businessId,
    name,
    triggerEvent,
    actionType,
    actionConfig,
    enabled: true,
  });
  if (error || !data) return fail(error?.message ?? "Failed to create rule");

  await logAudit(ctx.supabase, {
    businessId: ctx.businessId,
    actorUserId: ctx.userId,
    action: "automation.rule.create",
    targetKind: "automation_rule",
    targetId: data.id,
    metadata: { name, triggerEvent, actionType },
  });

  revalidatePath("/dashboard/automations");
  return ok({ id: data.id });
}

export async function toggleAutomationRuleAction(
  formData: FormData,
): Promise<ServiceResult<{ ok: true }>> {
  const ctx = await resolveContext();
  if (!ctx) return fail("No business found");

  const id = pick(formData, "id");
  const enabled = pick(formData, "enabled") === "true";
  if (!id) return fail("Missing id");

  const repo = createAutomationRepository(ctx.supabase);
  const { error } = await repo.toggle(id, enabled);
  if (error) return fail(error.message);

  await logAudit(ctx.supabase, {
    businessId: ctx.businessId,
    actorUserId: ctx.userId,
    action: "automation.rule.toggle",
    targetKind: "automation_rule",
    targetId: id,
    metadata: { enabled },
  });

  revalidatePath("/dashboard/automations");
  return ok({ ok: true });
}

export async function deleteAutomationRuleAction(
  formData: FormData,
): Promise<ServiceResult<{ ok: true }>> {
  const ctx = await resolveContext();
  if (!ctx) return fail("No business found");

  const id = pick(formData, "id");
  if (!id) return fail("Missing id");

  const repo = createAutomationRepository(ctx.supabase);
  const { error } = await repo.remove(id);
  if (error) return fail(error.message);

  await logAudit(ctx.supabase, {
    businessId: ctx.businessId,
    actorUserId: ctx.userId,
    action: "automation.rule.delete",
    targetKind: "automation_rule",
    targetId: id,
  });

  revalidatePath("/dashboard/automations");
  return ok({ ok: true });
}

function pick(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}
