import type { SupabaseClient } from "@supabase/supabase-js";

import { createAuditLogRepository } from "@/repositories/cross-cutting.repository";

/**
 * Fire-and-forget audit logger. Never throws — telemetry failures must not
 * break the caller. Use from server actions and route handlers wherever a
 * meaningful mutation happens (engine start/advance, asset publish, etc.).
 */
export async function logAudit(
  client: SupabaseClient,
  input: {
    businessId?: string | null;
    actorUserId?: string | null;
    action: string;
    targetKind?: string | null;
    targetId?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  try {
    const repo = createAuditLogRepository(client);
    await repo.record(input);
  } catch {
    // Swallow — audit logs must never break user actions.
  }
}
