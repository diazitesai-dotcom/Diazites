import { GrowthModulePage } from "@/components/layout/growth-module-page";
import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";
import { getTasksForBusiness } from "@/services/tasks/task.service";
import type { TaskRecord } from "@/types/platform-growth";

export default async function TasksPage() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  let tasks: TaskRecord[] = [];
  if (business) {
    const res = await getTasksForBusiness(supabase, user.id, business.id);
    if (res.success && res.data) tasks = res.data;
  }

  return (
    <GrowthModulePage
      eyebrow="Tasks"
      title="Task automation"
      description="Follow-up, call, review, and approval tasks created by the Task Agent from lead activity."
      purposeTitle="My tasks · Agent tasks · Overdue"
      purposeDescription="Phase 1 lists tasks from the database when migration 016 is applied; otherwise seed tasks appear after onboarding."
      primaryHref="/dashboard/agents"
      primaryLabel="Task Agent"
    >
      <ul className="space-y-2">
        {tasks.length === 0 ? (
          <li className="text-sm text-muted-foreground">No tasks yet — complete onboarding to seed defaults.</li>
        ) : (
          tasks.map((t) => (
            <li
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.08] px-4 py-3 text-sm"
            >
              <span className="font-medium">{t.title}</span>
              <span className="text-xs capitalize text-muted-foreground">
                {t.status} · {t.priority}
                {t.sourceAgent ? ` · ${t.sourceAgent}` : ""}
              </span>
            </li>
          ))
        )}
      </ul>
    </GrowthModulePage>
  );
}
