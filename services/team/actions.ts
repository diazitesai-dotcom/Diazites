"use server";

import { revalidatePath } from "next/cache";

import { logAudit } from "@/lib/audit/log";
import { requireAuth } from "@/lib/auth/session";
import { fail, ok, type ServiceResult } from "@/lib/result";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";
import {
  createTeamMemberRepository,
  type TeamRole,
} from "@/repositories/cross-cutting.repository";

async function resolveContext() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business) return null;
  return { supabase, userId: user.id, businessId: business.id };
}

export async function inviteTeamMemberAction(
  formData: FormData,
): Promise<ServiceResult<{ id: string }>> {
  const ctx = await resolveContext();
  if (!ctx) return fail("No business found");

  const email = pick(formData, "email");
  const role = (pick(formData, "role") ?? "member") as TeamRole;
  if (!email || !email.includes("@")) return fail("Valid email required");
  if (!["owner", "admin", "member", "viewer"].includes(role)) {
    return fail("Invalid role");
  }

  const repo = createTeamMemberRepository(ctx.supabase);
  const { data, error } = await repo.invite({
    businessId: ctx.businessId,
    email,
    role,
    invitedBy: ctx.userId,
  });
  if (error || !data) return fail(error?.message ?? "Failed to invite");

  await logAudit(ctx.supabase, {
    businessId: ctx.businessId,
    actorUserId: ctx.userId,
    action: "team.invite",
    targetKind: "team_member",
    targetId: data.id,
    metadata: { email, role },
  });

  revalidatePath("/dashboard/team");
  return ok({ id: data.id });
}

export async function setTeamRoleAction(
  formData: FormData,
): Promise<ServiceResult<{ ok: true }>> {
  const ctx = await resolveContext();
  if (!ctx) return fail("No business found");

  const id = pick(formData, "id");
  const role = pick(formData, "role") as TeamRole | undefined;
  if (!id || !role) return fail("Missing id or role");
  if (!["owner", "admin", "member", "viewer"].includes(role)) {
    return fail("Invalid role");
  }

  const repo = createTeamMemberRepository(ctx.supabase);
  const { error } = await repo.setRole(id, role);
  if (error) return fail(error.message);

  await logAudit(ctx.supabase, {
    businessId: ctx.businessId,
    actorUserId: ctx.userId,
    action: "team.set_role",
    targetKind: "team_member",
    targetId: id,
    metadata: { role },
  });

  revalidatePath("/dashboard/team");
  return ok({ ok: true });
}

export async function removeTeamMemberAction(
  formData: FormData,
): Promise<ServiceResult<{ ok: true }>> {
  const ctx = await resolveContext();
  if (!ctx) return fail("No business found");

  const id = pick(formData, "id");
  if (!id) return fail("Missing id");

  const repo = createTeamMemberRepository(ctx.supabase);
  const { error } = await repo.remove(id);
  if (error) return fail(error.message);

  await logAudit(ctx.supabase, {
    businessId: ctx.businessId,
    actorUserId: ctx.userId,
    action: "team.remove",
    targetKind: "team_member",
    targetId: id,
  });

  revalidatePath("/dashboard/team");
  return ok({ ok: true });
}

function pick(fd: FormData, key: string): string | undefined {
  const v = fd.get(key);
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}
