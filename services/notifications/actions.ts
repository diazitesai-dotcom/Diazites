"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/auth/session";
import { fail, ok, type ServiceResult } from "@/lib/result";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  createNotificationRepository,
  type NotificationRow,
} from "@/repositories/cross-cutting.repository";

export async function listNotificationsAction(): Promise<
  ServiceResult<{ items: NotificationRow[]; unread: number }>
> {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const repo = createNotificationRepository(supabase);

  const [{ data: list }, { count }] = await Promise.all([
    repo.listForUser(user.id, 20),
    repo.countUnread(user.id),
  ]);

  return ok({
    items: ((list ?? []) as NotificationRow[]),
    unread: count ?? 0,
  });
}

export async function markNotificationReadAction(
  formData: FormData,
): Promise<ServiceResult<{ ok: true }>> {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  void user;

  const id = formData.get("id");
  const repo = createNotificationRepository(supabase);

  if (typeof id === "string" && id.length > 0) {
    const { error } = await repo.markRead(id);
    if (error) return fail(error.message);
  } else {
    const { error } = await repo.markAllReadForUser(user.id);
    if (error) return fail(error.message);
  }

  revalidatePath("/dashboard");
  return ok({ ok: true });
}
