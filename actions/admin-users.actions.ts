"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/auth/session";
import { fail, type ServiceResult } from "@/lib/result";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import {
  grantPlatformAdmin,
  revokePlatformAdmin,
} from "@/services/admin/admin-users.service";

async function requirePlatformAdmin() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const { data: admin } = await supabase
    .from("admin_users")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!admin) return null;
  return { user, service: createServiceRoleClient() };
}

export async function grantPlatformAdminAction(
  email: string,
): Promise<ServiceResult<{ userId: string }>> {
  const ctx = await requirePlatformAdmin();
  if (!ctx) return fail("Admin access required");

  const result = await grantPlatformAdmin(ctx.service, ctx.user.id, email);
  if (result.success) {
    revalidatePath("/admin/users");
    revalidatePath("/admin");
  }
  return result;
}

export async function revokePlatformAdminAction(
  userId: string,
): Promise<ServiceResult<{ ok: true }>> {
  const ctx = await requirePlatformAdmin();
  if (!ctx) return fail("Admin access required");

  const result = await revokePlatformAdmin(ctx.service, ctx.user.id, userId);
  if (result.success) {
    revalidatePath("/admin/users");
    revalidatePath("/admin");
  }
  return result;
}
