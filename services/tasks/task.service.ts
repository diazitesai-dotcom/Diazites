import type { SupabaseClient } from "@supabase/supabase-js";

import { ok, fail, type ServiceResult } from "@/lib/result";
import { createBusinessRepository } from "@/repositories/business.repository";
import { createTaskRepository } from "@/repositories/task.repository";
import type { TaskRecord } from "@/types/platform-growth";

function mapTask(row: Record<string, unknown>): TaskRecord {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    title: String(row.title),
    description: row.description != null ? String(row.description) : null,
    status: row.status as TaskRecord["status"],
    priority: row.priority as TaskRecord["priority"],
    assignedTo: row.assigned_to != null ? String(row.assigned_to) : null,
    sourceAgent: row.source_agent != null ? String(row.source_agent) : null,
    dueAt: row.due_at != null ? String(row.due_at) : null,
    createdAt: String(row.created_at),
  };
}

export async function getTasksForBusiness(
  client: SupabaseClient,
  ownerUserId: string,
  businessId: string,
): Promise<ServiceResult<TaskRecord[]>> {
  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(businessId);
  if (!business || business.user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  const repo = createTaskRepository(client);
  const { data, error } = await repo.listByBusiness(businessId);
  if (error) return fail(error.message);

  return ok((data ?? []).map((r) => mapTask(r as Record<string, unknown>)));
}

export async function seedDefaultTasksIfEmpty(
  client: SupabaseClient,
  businessId: string,
): Promise<void> {
  const repo = createTaskRepository(client);
  const { count } = await repo.countPending(businessId);
  if (count && count > 0) return;

  const seeds = [
    { title: "Connect Google Ads account", sourceAgent: "ads", priority: "high" as const },
    { title: "Review AI-generated landing page draft", sourceAgent: "landing_page", priority: "medium" as const },
    { title: "Approve first campaign launch", sourceAgent: "strategy", priority: "high" as const },
  ];

  for (const s of seeds) {
    await repo.insert({
      businessId,
      title: s.title,
      sourceAgent: s.sourceAgent,
      priority: s.priority,
      status: "pending",
    });
  }
}
