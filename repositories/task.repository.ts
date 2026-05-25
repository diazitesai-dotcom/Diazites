import type { SupabaseClient } from "@supabase/supabase-js";

import type { TaskPriority, TaskStatus } from "@/types/platform-growth";

export function createTaskRepository(client: SupabaseClient) {
  return {
    async listByBusiness(businessId: string, limit = 50) {
      return client
        .from("tasks")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(limit);
    },

    async insert(input: {
      businessId: string;
      title: string;
      description?: string | null;
      status?: TaskStatus;
      priority?: TaskPriority;
      assignedTo?: string | null;
      sourceAgent?: string | null;
      leadId?: string | null;
      dueAt?: string | null;
    }) {
      return client
        .from("tasks")
        .insert({
          business_id: input.businessId,
          title: input.title,
          description: input.description ?? null,
          status: input.status ?? "pending",
          priority: input.priority ?? "medium",
          assigned_to: input.assignedTo ?? null,
          source_agent: input.sourceAgent ?? null,
          lead_id: input.leadId ?? null,
          due_at: input.dueAt ?? null,
        })
        .select("*")
        .single();
    },

    async countPending(businessId: string) {
      return client
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .in("status", ["pending", "in_progress", "overdue"]);
    },
  };
}
