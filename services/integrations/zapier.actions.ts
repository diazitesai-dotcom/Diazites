"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { logAudit } from "@/lib/audit/log";
import { requireAuth } from "@/lib/auth/session";
import { fail, ok, type ServiceResult } from "@/lib/result";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAutomationRepository } from "@/repositories/automation.repository";
import { createBusinessRepository } from "@/repositories/business.repository";

import {
  ZAPIER_SUBSCRIBABLE_EVENTS,
  subscribeZapier,
  testZapierWebhook,
} from "@/services/integrations/zapier.service";
import type { SystemEventType } from "@/types/backend";

export async function subscribeZapierAction(
  formData: FormData,
): Promise<ServiceResult<{ created: number }>> {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();

  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business) redirect("/onboarding?error=Complete+onboarding+first");

  const name = pickString(formData.get("name")) ?? "Zapier Zap";
  const url = pickString(formData.get("url"));
  if (!url) return fail("Webhook URL is required");

  const allowed = new Set(ZAPIER_SUBSCRIBABLE_EVENTS.map((e) => e.type as string));
  const events = formData
    .getAll("events")
    .map((v) => (typeof v === "string" ? v : ""))
    .filter((v) => allowed.has(v)) as SystemEventType[];

  const result = await subscribeZapier(supabase, {
    businessId: business.id,
    name,
    url,
    events,
  });
  if (!result.success) return fail(result.error);

  await logAudit(supabase, {
    actorUserId: user.id,
    businessId: business.id,
    action: "zapier.subscribe",
    targetKind: "automation_rule",
    metadata: { url, events, created: result.data.created },
  });

  revalidatePath("/dashboard/ads");
  revalidatePath("/dashboard/automations");
  return ok(result.data);
}

export async function testZapierWebhookAction(
  formData: FormData,
): Promise<ServiceResult<{ httpStatus: number }>> {
  await requireAuth();
  const url = pickString(formData.get("url"));
  if (!url) return fail("Webhook URL is required");
  const result = await testZapierWebhook(url);
  if (!result.success) return fail(result.error);
  return ok(result.data);
}

export async function disconnectZapierRuleAction(
  formData: FormData,
): Promise<ServiceResult<{ id: string }>> {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();

  const id = pickString(formData.get("id"));
  if (!id) return fail("Missing rule id");

  const automation = createAutomationRepository(supabase);
  const { error } = await automation.remove(id);
  if (error) return fail(error.message);

  await logAudit(supabase, {
    actorUserId: user.id,
    action: "zapier.disconnect",
    targetKind: "automation_rule",
    targetId: id,
  });

  revalidatePath("/dashboard/ads");
  revalidatePath("/dashboard/automations");
  return ok({ id });
}

function pickString(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
