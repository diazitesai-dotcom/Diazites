import type { SupabaseClient } from "@supabase/supabase-js";

import { createAuditLogRepository } from "@/repositories/audit-log.repository";

export async function writeAuditLog(
  client: SupabaseClient,
  input: {
    businessId: string;
    actorUserId?: string | null;
    actorType?: "user" | "ai" | "agent" | "system";
    action: string;
    entityType: string;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  try {
    const repo = createAuditLogRepository(client);
    await repo.insert(input);
  } catch (e) {
    console.error("[writeAuditLog] failed", e);
  }
}
