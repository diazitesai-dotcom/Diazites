"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ensureBootstrapPlatformAdmin } from "@/lib/auth/bootstrap-platform-admin";
import { requireAuth } from "@/lib/auth/session";
import { fail, ok, type ServiceResult } from "@/lib/result";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function tryBootstrapPlatformAdminAction(): Promise<
  ServiceResult<{ granted: boolean }>
> {
  const user = await requireAuth();
  const granted = await ensureBootstrapPlatformAdmin(user);

  if (granted) {
    revalidatePath("/", "layout");
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return ok({ granted: true });
  }

  return ok({ granted: false });
}

export async function tryBootstrapPlatformAdminRedirectAction() {
  const user = await requireAuth();
  const granted = await ensureBootstrapPlatformAdmin(user);

  revalidatePath("/", "layout");

  if (granted) {
    redirect("/admin");
  }

  redirect("/dashboard?admin_access=denied&bootstrap=failed");
}

export async function getAdminAccessStatusAction(): Promise<
  ServiceResult<{
    email: string;
    isPlatformAdmin: boolean;
    bootstrapConfigured: boolean;
    bootstrapEmailMatch: boolean;
  }>
> {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const { isBootstrapAdminEmail } = await import("@/lib/auth/bootstrap-platform-admin");

  return ok({
    email: user.email ?? "",
    isPlatformAdmin: Boolean(adminUser),
    bootstrapConfigured: Boolean(process.env.PLATFORM_BOOTSTRAP_ADMIN_EMAIL?.trim()),
    bootstrapEmailMatch: isBootstrapAdminEmail(user.email),
  });
}
