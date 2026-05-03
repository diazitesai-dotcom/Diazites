import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminUsersRepository } from "@/repositories/admin-users.repository";

/** Ensures current user is listed in `admin_users`. */
export async function requireAdminUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const adminRepo = createAdminUsersRepository(supabase);
  const { isAdmin } = await adminRepo.isAdmin(user.id);

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return user;
}
