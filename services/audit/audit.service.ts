import type { SupabaseClient } from "@supabase/supabase-js";

import { logAudit } from "@/lib/audit/log";

/** Writes to cross-cutting audit_logs (011). */
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
  await logAudit(client, {
    businessId: input.businessId,
    actorUserId: input.actorUserId,
    action: input.action,
    targetKind: input.entityType,
    targetId: input.entityId ?? undefined,
    metadata: {
      ...input.metadata,
      actorType: input.actorType ?? "user",
    },
  });
}
