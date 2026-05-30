import type { SupabaseClient } from "@supabase/supabase-js";

import { fail, ok, type ServiceResult } from "@/lib/result";
import { createAdminUsersRepository } from "@/repositories/admin-users.repository";
import { createPlatformAdminRepository } from "@/repositories/platform-admin.repository";

export type PlatformAdminUserView = {
  id: string;
  userId: string;
  email: string;
  fullName: string | null;
  role: string;
  createdAt: string;
};

export async function loadPlatformAdminUsers(
  client: SupabaseClient,
): Promise<ServiceResult<PlatformAdminUserView[]>> {
  const adminRepo = createAdminUsersRepository(client);
  const { data: admins, error } = await adminRepo.listAll();

  if (error) return fail(error.message);

  const userIds = (admins ?? []).map((row) => row.user_id);
  if (userIds.length === 0) return ok([]);

  const [{ data: users, error: usersError }, { data: profiles, error: profilesError }] =
    await Promise.all([
      client.from("users").select("id, email").in("id", userIds),
      client.from("profiles").select("user_id, full_name").in("user_id", userIds),
    ]);

  if (usersError) return fail(usersError.message);
  if (profilesError) return fail(profilesError.message);

  const emailByUser = new Map((users ?? []).map((u) => [u.id, u.email]));
  const nameByUser = new Map((profiles ?? []).map((p) => [p.user_id, p.full_name]));

  const rows: PlatformAdminUserView[] = (admins ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    email: emailByUser.get(row.user_id) ?? "unknown",
    fullName: nameByUser.get(row.user_id) ?? null,
    role: row.role,
    createdAt: row.created_at,
  }));

  return ok(rows);
}

export async function grantPlatformAdmin(
  client: SupabaseClient,
  actorUserId: string,
  email: string,
): Promise<ServiceResult<{ userId: string }>> {
  const normalized = email.trim();
  if (!normalized) return fail("Email is required.");

  const adminRepo = createAdminUsersRepository(client);
  const platformRepo = createPlatformAdminRepository(client);

  const { data: user, error: lookupError } = await adminRepo.findUserByEmail(normalized);
  if (lookupError) return fail(lookupError.message);
  if (!user) {
    return fail("No user found with that email. They must sign up first.");
  }

  const { data: existing } = await client
    .from("admin_users")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return fail("This user is already a platform admin.");

  const { error: grantError } = await adminRepo.grantAdmin(user.id);
  if (grantError) return fail(grantError.message);

  await platformRepo.logAdminAction({
    actorUserId,
    actionType: "admin_user.grant",
    targetUserId: user.id,
    details: { email: user.email },
  });

  return ok({ userId: user.id });
}

export async function revokePlatformAdmin(
  client: SupabaseClient,
  actorUserId: string,
  targetUserId: string,
): Promise<ServiceResult<{ ok: true }>> {
  if (actorUserId === targetUserId) {
    return fail("You cannot remove your own platform admin access.");
  }

  const adminRepo = createAdminUsersRepository(client);
  const platformRepo = createPlatformAdminRepository(client);

  const { count, error: countError } = await adminRepo.countAdmins();
  if (countError) return fail(countError.message);
  if ((count ?? 0) <= 1) {
    return fail("Cannot remove the last platform admin.");
  }

  const { data: targetAdmin } = await client
    .from("admin_users")
    .select("id, user_id")
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (!targetAdmin) return fail("User is not a platform admin.");

  const { error: revokeError } = await adminRepo.revokeAdmin(targetUserId);
  if (revokeError) return fail(revokeError.message);

  await platformRepo.logAdminAction({
    actorUserId,
    actionType: "admin_user.revoke",
    targetUserId,
  });

  return ok({ ok: true });
}
