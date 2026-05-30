import type { User } from "@supabase/supabase-js";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { createAdminUsersRepository } from "@/repositories/admin-users.repository";

function getBootstrapEmails(): string[] {
  const raw = process.env.PLATFORM_BOOTSTRAP_ADMIN_EMAIL?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Grants platform admin when PLATFORM_BOOTSTRAP_ADMIN_EMAIL matches the signed-in user.
 * By default only runs when no admins exist yet (first operator on production).
 */
export async function ensureBootstrapPlatformAdmin(
  user: Pick<User, "id" | "email">,
): Promise<boolean> {
  const allowedEmails = getBootstrapEmails();
  if (allowedEmails.length === 0) return false;

  const userEmail = (user.email ?? "").trim().toLowerCase();
  if (!userEmail || !allowedEmails.includes(userEmail)) return false;

  let service;
  try {
    service = createServiceRoleClient();
  } catch {
    return false;
  }

  const adminRepo = createAdminUsersRepository(service);
  const { isAdmin } = await adminRepo.isAdmin(user.id);
  if (isAdmin) return true;

  const allowIfExists = process.env.PLATFORM_BOOTSTRAP_ALLOW_IF_ADMINS_EXIST === "true";
  if (!allowIfExists) {
    const { count } = await adminRepo.countAdmins();
    if ((count ?? 0) > 0) return false;
  }

  const { error } = await adminRepo.grantAdmin(user.id);
  return !error;
}

export function isBootstrapAdminEmail(email: string | null | undefined): boolean {
  const normalized = (email ?? "").trim().toLowerCase();
  if (!normalized) return false;
  return getBootstrapEmails().includes(normalized);
}
