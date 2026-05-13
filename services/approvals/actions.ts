"use server";

import { revalidatePath } from "next/cache";

import { logAudit } from "@/lib/audit/log";
import { requireAuth } from "@/lib/auth/session";
import { fail, ok, type ServiceResult } from "@/lib/result";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createApprovalRepository } from "@/repositories/cross-cutting.repository";
import { createBusinessRepository } from "@/repositories/business.repository";

export async function decideApprovalAction(
  formData: FormData,
): Promise<ServiceResult<{ ok: true }>> {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business) return fail("No business found");

  const id = pick(formData, "id");
  const decision = pick(formData, "decision");
  const note = pick(formData, "note");
  if (!id || (decision !== "approved" && decision !== "rejected")) {
    return fail("Missing id or invalid decision");
  }

  const repo = createApprovalRepository(supabase);
  const { error } = await repo.decide({
    id,
    decidedBy: user.id,
    state: decision,
    note: note ?? null,
  });
  if (error) return fail(error.message);

  await logAudit(supabase, {
    businessId: business.id,
    actorUserId: user.id,
    action: `approval.${decision}`,
    targetKind: "approval",
    targetId: id,
  });

  revalidatePath("/dashboard/approvals");
  return ok({ ok: true });
}

function pick(fd: FormData, key: string): string | undefined {
  const v = fd.get(key);
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}
