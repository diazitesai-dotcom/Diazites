import type { SupabaseClient } from "@supabase/supabase-js";

import { fail, ok, type ServiceResult } from "@/lib/result";
import type {
  AdminUserDetails,
  AdminUserListItem,
  CurrentUserAccess,
  PlatformPlanKey,
  PlatformServiceKey,
} from "@/types/access-control";

import { createAdminUsersRepository } from "@/repositories/admin-users.repository";

async function isOwnerAdmin(
  client: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const adminRepo = createAdminUsersRepository(client);
  const { isAdmin } = await adminRepo.isAdmin(userId);
  if (isAdmin) return true;

  const { data } = await client
    .from("user_platform_accounts")
    .select("account_role")
    .eq("user_id", userId)
    .maybeSingle();

  return data?.account_role === "owner_admin";
}

export async function provisionUserAccess(
  client: SupabaseClient,
  userId: string,
): Promise<ServiceResult<void>> {
  const { error } = await client.rpc("provision_user_access", {
    p_user_id: userId,
  });
  if (error) return fail(error.message, "PROVISION_FAILED");
  return ok(undefined);
}

export async function getCurrentUserAccess(
  client: SupabaseClient,
  userId: string,
  email: string | null,
): Promise<ServiceResult<CurrentUserAccess>> {
  const ownerAdmin = await isOwnerAdmin(client, userId);

  const [{ data: account }, { data: profile }, { data: services }, { data: access }] =
    await Promise.all([
      client
        .from("user_platform_accounts")
        .select("plan_key, account_role, status")
        .eq("user_id", userId)
        .maybeSingle(),
      client
        .from("profiles")
        .select("full_name")
        .eq("user_id", userId)
        .maybeSingle(),
      client
        .from("platform_services")
        .select("id, key, label, description, is_active, sort_order")
        .eq("is_active", true)
        .order("sort_order"),
      client
        .from("user_service_access")
        .select("service_key, enabled")
        .eq("user_id", userId),
    ]);

  if (!account) {
    const prov = await provisionUserAccess(client, userId);
    if (!prov.success) return prov as ServiceResult<CurrentUserAccess>;
    return getCurrentUserAccess(client, userId, email);
  }

  const accessMap = new Map(
    (access ?? []).map((r) => [r.service_key as string, r.enabled as boolean]),
  );

  const enabledServiceKeys = ownerAdmin
    ? ((services ?? []).map((s) => s.key) as PlatformServiceKey[])
    : ((access ?? [])
        .filter((r) => r.enabled)
        .map((r) => r.service_key as PlatformServiceKey));

  return ok({
    userId,
    email,
    fullName: profile?.full_name ?? null,
    accountRole: ownerAdmin ? "owner_admin" : (account.account_role as "user"),
    planKey: account.plan_key as PlatformPlanKey,
    status: account.status as CurrentUserAccess["status"],
    isOwnerAdmin: ownerAdmin,
    enabledServiceKeys,
    allServices: (services ?? []).map((s) => ({
      id: s.id,
      key: s.key as PlatformServiceKey,
      label: s.label,
      description: s.description,
      is_active: s.is_active,
      sort_order: s.sort_order,
    })),
  });
}

export async function userHasService(
  client: SupabaseClient,
  userId: string,
  serviceKey: PlatformServiceKey,
): Promise<boolean> {
  if (await isOwnerAdmin(client, userId)) return true;

  const { data: account } = await client
    .from("user_platform_accounts")
    .select("status")
    .eq("user_id", userId)
    .maybeSingle();

  if (!account || account.status !== "active") return false;

  const { data } = await client
    .from("user_service_access")
    .select("enabled")
    .eq("user_id", userId)
    .eq("service_key", serviceKey)
    .maybeSingle();

  return Boolean(data?.enabled);
}

export async function requireServiceAccess(
  client: SupabaseClient,
  userId: string,
  serviceKey: PlatformServiceKey,
): Promise<ServiceResult<void>> {
  const allowed = await userHasService(client, userId, serviceKey);
  if (!allowed) {
    return fail(
      `Service "${serviceKey}" is not enabled for this account.`,
      "SERVICE_ACCESS_DENIED",
    );
  }
  return ok(undefined);
}

export async function listUsersForAdmin(
  serviceClient: SupabaseClient,
  query?: string,
): Promise<ServiceResult<AdminUserListItem[]>> {
  let usersQuery = serviceClient
    .from("users")
    .select("id, email, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (query?.trim()) {
    usersQuery = usersQuery.ilike("email", `%${query.trim()}%`);
  }

  const { data: users, error: usersError } = await usersQuery;
  if (usersError) return fail(usersError.message);

  const userIds = (users ?? []).map((u) => u.id);
  if (userIds.length === 0) return ok([]);

  const [{ data: profiles }, { data: accounts }, { data: access }] = await Promise.all([
    serviceClient.from("profiles").select("user_id, full_name").in("user_id", userIds),
    serviceClient
      .from("user_platform_accounts")
      .select("user_id, plan_key, account_role, status")
      .in("user_id", userIds),
    serviceClient
      .from("user_service_access")
      .select("user_id, enabled")
      .in("user_id", userIds)
      .eq("enabled", true),
  ]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p.full_name]));
  const accountMap = new Map((accounts ?? []).map((a) => [a.user_id, a]));
  const enabledCount = new Map<string, number>();
  for (const row of access ?? []) {
    enabledCount.set(row.user_id, (enabledCount.get(row.user_id) ?? 0) + 1);
  }

  const items: AdminUserListItem[] = (users ?? []).map((u) => {
    const acc = accountMap.get(u.id);
    return {
      userId: u.id,
      email: u.email,
      fullName: profileMap.get(u.id) ?? null,
      planKey: (acc?.plan_key ?? "free") as PlatformPlanKey,
      accountRole: (acc?.account_role ?? "user") as AdminUserListItem["accountRole"],
      status: (acc?.status ?? "active") as AdminUserListItem["status"],
      createdAt: u.created_at,
      enabledServiceCount: enabledCount.get(u.id) ?? 0,
    };
  });

  return ok(items);
}

export async function getUserAdminDetails(
  serviceClient: SupabaseClient,
  targetUserId: string,
): Promise<ServiceResult<AdminUserDetails>> {
  const { data: user, error: userError } = await serviceClient
    .from("users")
    .select("id, email, created_at")
    .eq("id", targetUserId)
    .maybeSingle();

  if (userError || !user) {
    return fail(userError?.message ?? "User not found", "USER_NOT_FOUND");
  }

  const [{ data: profile }, { data: account }, { data: services }, { data: access }, { data: logs }] =
    await Promise.all([
      serviceClient
        .from("profiles")
        .select("full_name")
        .eq("user_id", targetUserId)
        .maybeSingle(),
      serviceClient
        .from("user_platform_accounts")
        .select("plan_key, account_role, status")
        .eq("user_id", targetUserId)
        .maybeSingle(),
      serviceClient
        .from("platform_services")
        .select("id, key, label, description, is_active, sort_order")
        .eq("is_active", true)
        .order("sort_order"),
      serviceClient
        .from("user_service_access")
        .select("service_key, enabled, enabled_at, disabled_at")
        .eq("user_id", targetUserId),
      serviceClient
        .from("access_control_audit_logs")
        .select(
          "id, action_type, service_key, plan_key, previous_value, new_value, actor_user_id, created_at",
        )
        .eq("target_user_id", targetUserId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  const accessMap = new Map(
    (access ?? []).map((a) => [
      a.service_key,
      {
        enabled: a.enabled as boolean,
        enabledAt: a.enabled_at as string | null,
        disabledAt: a.disabled_at as string | null,
      },
    ]),
  );

  const enabledCount = (access ?? []).filter((a) => a.enabled).length;

  return ok({
    user: {
      userId: user.id,
      email: user.email,
      fullName: profile?.full_name ?? null,
      planKey: (account?.plan_key ?? "free") as PlatformPlanKey,
      accountRole: (account?.account_role ?? "user") as AdminUserListItem["accountRole"],
      status: (account?.status ?? "active") as AdminUserListItem["status"],
      createdAt: user.created_at,
      enabledServiceCount: enabledCount,
    },
    services: (services ?? []).map((s) => {
      const row = accessMap.get(s.key);
      return {
        id: s.id,
        key: s.key as PlatformServiceKey,
        label: s.label,
        description: s.description,
        is_active: s.is_active,
        sort_order: s.sort_order,
        enabled: row?.enabled ?? false,
        enabledAt: row?.enabledAt ?? null,
        disabledAt: row?.disabledAt ?? null,
      };
    }),
    auditLogs: (logs ?? []).map((l) => ({
      id: l.id,
      actionType: l.action_type as AdminUserDetails["auditLogs"][0]["actionType"],
      serviceKey: l.service_key,
      planKey: l.plan_key,
      previousValue: l.previous_value as Record<string, unknown> | null,
      newValue: l.new_value as Record<string, unknown> | null,
      actorUserId: l.actor_user_id,
      createdAt: l.created_at,
    })),
  });
}

export async function updateUserPlan(
  adminClient: SupabaseClient,
  targetUserId: string,
  planKey: PlatformPlanKey,
): Promise<ServiceResult<void>> {
  const { error } = await adminClient.rpc("admin_update_user_plan", {
    p_target_user_id: targetUserId,
    p_plan_key: planKey,
  });
  if (error) return fail(error.message, "PLAN_UPDATE_FAILED");
  return ok(undefined);
}

export async function enableUserService(
  adminClient: SupabaseClient,
  targetUserId: string,
  serviceKey: PlatformServiceKey,
): Promise<ServiceResult<void>> {
  const { error } = await adminClient.rpc("admin_set_user_service", {
    p_target_user_id: targetUserId,
    p_service_key: serviceKey,
    p_enabled: true,
  });
  if (error) return fail(error.message, "SERVICE_ENABLE_FAILED");
  return ok(undefined);
}

export async function disableUserService(
  adminClient: SupabaseClient,
  targetUserId: string,
  serviceKey: PlatformServiceKey,
): Promise<ServiceResult<void>> {
  const { error } = await adminClient.rpc("admin_set_user_service", {
    p_target_user_id: targetUserId,
    p_service_key: serviceKey,
    p_enabled: false,
  });
  if (error) return fail(error.message, "SERVICE_DISABLE_FAILED");
  return ok(undefined);
}

export async function getAuditLogsForUser(
  serviceClient: SupabaseClient,
  targetUserId: string,
): Promise<ServiceResult<AdminUserDetails["auditLogs"]>> {
  const { data, error } = await serviceClient
    .from("access_control_audit_logs")
    .select(
      "id, action_type, service_key, plan_key, previous_value, new_value, actor_user_id, created_at",
    )
    .eq("target_user_id", targetUserId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return fail(error.message);

  return ok(
    (data ?? []).map((l) => ({
      id: l.id,
      actionType: l.action_type as AdminUserDetails["auditLogs"][0]["actionType"],
      serviceKey: l.service_key,
      planKey: l.plan_key,
      previousValue: l.previous_value as Record<string, unknown> | null,
      newValue: l.new_value as Record<string, unknown> | null,
      actorUserId: l.actor_user_id,
      createdAt: l.created_at,
    })),
  );
}
