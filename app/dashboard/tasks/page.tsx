import { PageHeader } from "@/components/layout/page-header";
import {
  TasksProjectsClient,
  type ProjectBoardView,
  type ProjectTaskView,
} from "@/components/tasks/tasks-projects-client";
import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";
import { getTasksForBusiness } from "@/services/tasks/task.service";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);

  let legacyTasks: import("@/types/platform-growth").TaskRecord[] = [];
  const boards: ProjectBoardView[] = [];
  const projectTasks: ProjectTaskView[] = [];

  if (business) {
    const res = await getTasksForBusiness(supabase, user.id, business.id);
    if (res.success && res.data) legacyTasks = res.data;

    const { data: boardRows } = await supabase
      .from("project_boards")
      .select("id, name, project_id")
      .eq("business_id", business.id)
      .order("created_at", { ascending: true });

    const projectIds = (boardRows ?? []).map((b) => b.project_id).filter(Boolean) as string[];
    const { data: projectRows } = projectIds.length
      ? await supabase.from("projects").select("id, name").in("id", projectIds)
      : { data: [] };

    const projectNameById = new Map(
      (projectRows ?? []).map((p) => [p.id as string, p.name as string]),
    );

    for (const row of boardRows ?? []) {
      boards.push({
        id: row.id as string,
        name: row.name as string,
        projectName: projectNameById.get(row.project_id as string) ?? (row.name as string),
      });
    }

    const { data: taskRows } = await supabase
      .from("project_tasks")
      .select("*")
      .eq("business_id", business.id)
      .order("sort_order", { ascending: true });

    for (const row of taskRows ?? []) {
      const desc = row.description as string | null;
      projectTasks.push({
        id: row.id as string,
        boardId: row.board_id as string | null,
        title: row.title as string,
        description: desc,
        status: row.status as ProjectTaskView["status"],
        priority: row.priority as string,
        assignedTo: desc?.startsWith("Assigned to:") ? desc.replace("Assigned to:", "").trim() : null,
      });
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 py-4">
      <PageHeader
        eyebrow="Automation"
        title="Tasks & projects"
        description="Create projects, assign tasks, and move work through stages — alongside agent-generated tasks."
      />
      <TasksProjectsClient
        boards={boards}
        projectTasks={projectTasks}
        legacyTasks={legacyTasks}
      />
    </div>
  );
}
