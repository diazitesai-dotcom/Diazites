import type { SupabaseClient } from "@supabase/supabase-js";

export function createAuditLogRepository(client: SupabaseClient) {
  return {
    async insert(input: {
      businessId: string;
      actorUserId?: string | null;
      actorType?: string;
      action: string;
      entityType: string;
      entityId?: string | null;
      metadata?: Record<string, unknown>;
      ipAddress?: string | null;
    }) {
      return client
        .from("audit_logs")
        .insert({
          business_id: input.businessId,
          actor_user_id: input.actorUserId ?? null,
          actor_type: input.actorType ?? "user",
          action: input.action,
          entity_type: input.entityType,
          entity_id: input.entityId ?? null,
          metadata: input.metadata ?? {},
          ip_address: input.ipAddress ?? null,
        })
        .select("*")
        .single();
    },

    async listByBusiness(businessId: string, limit = 50) {
      return client
        .from("audit_logs")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(limit);
    },
  };
}
