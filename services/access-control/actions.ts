"use server";

import { revalidatePath } from "next/cache";

import {
  disableUserService,
  enableUserService,
  updateUserPlan,
} from "@/lib/access-control/access-control.service";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { PlatformPlanKey, PlatformServiceKey } from "@/types/access-control";

export async function adminEnableUserServiceAction(
  userId: string,
  serviceKey: PlatformServiceKey,
) {
  const { supabase } = await requireAdmin();
  const result = await enableUserService(supabase, userId, serviceKey);
  if (!result.success) throw new Error(result.error);
  revalidatePath("/admin/user-control");
  revalidatePath(`/admin/user-control/${userId}`);
}

export async function adminDisableUserServiceAction(
  userId: string,
  serviceKey: PlatformServiceKey,
) {
  const { supabase } = await requireAdmin();
  const result = await disableUserService(supabase, userId, serviceKey);
  if (!result.success) throw new Error(result.error);
  revalidatePath("/admin/user-control");
  revalidatePath(`/admin/user-control/${userId}`);
}

export async function adminUpdateUserPlanAction(userId: string, planKey: PlatformPlanKey) {
  const { supabase } = await requireAdmin();
  const result = await updateUserPlan(supabase, userId, planKey);
  if (!result.success) throw new Error(result.error);
  revalidatePath("/admin/user-control");
  revalidatePath(`/admin/user-control/${userId}`);
}

/** Ensures current session user has provisioned access (idempotent). */
export async function ensureCurrentUserAccessAction() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const };

  const { provisionUserAccess } = await import(
    "@/lib/access-control/access-control.service"
  );
  await provisionUserAccess(supabase, user.id);
  revalidatePath("/dashboard", "layout");
  return { ok: true as const };
}
