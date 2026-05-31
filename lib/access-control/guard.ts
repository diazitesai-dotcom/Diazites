import { redirect } from "next/navigation";

import { resolveRequiredServiceForPath } from "@/lib/access-control/constants";
import {
  getCurrentUserAccess,
  requireServiceAccess,
} from "@/lib/access-control/access-control.service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { PlatformServiceKey } from "@/types/access-control";

/**
 * Server Component / page guard: ensures authenticated user has a service enabled.
 */
export async function requireDashboardService(
  serviceKey?: PlatformServiceKey,
  pathname?: string,
) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const key =
    serviceKey ??
    (pathname ? resolveRequiredServiceForPath(pathname) : "basic_services");

  const accessResult = await getCurrentUserAccess(
    supabase,
    user.id,
    user.email ?? null,
  );

  if (!accessResult.success) {
    redirect("/dashboard?error=access");
  }

  if (accessResult.data.isOwnerAdmin) {
    return { supabase, user, access: accessResult.data };
  }

  const check = await requireServiceAccess(supabase, user.id, key);
  if (!check.success) {
    redirect("/dashboard?error=service_disabled");
  }

  return { supabase, user, access: accessResult.data };
}
