"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";
import type { ProjectBoardView, ProjectTaskView } from "@/components/tasks/tasks-projects-client";

async function businessContext() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business) return null;
  return { user, supabase, businessId: business.id as string };
}

export async function createTaskProjectAction(name: string): Promise<
  | { success: true; data: { board: ProjectBoardView } }
  | { success: false; error: string }
> {
  const ctx = await businessContext();
  if (!ctx) return { success: false, error: "No business found" };

  const { data: project, error: projectError } = await ctx.supabase
    .from("projects")
    .insert({ business_id: ctx.businessId, name, status: "active" })
    .select("*")
    .single();

  if (projectError || !project) {
    return { success: false, error: projectError?.message ?? "Project create failed" };
  }

  const { data: board, error: boardError } = await ctx.supabase
    .from("project_boards")
    .insert({
      business_id: ctx.businessId,
      project_id: project.id,
      name: "Main board",
      board_type: "kanban",
    })
    .select("*")
    .single();

  if (boardError || !board) {
    return { success: false, error: boardError?.message ?? "Board create failed" };
  }

  revalidatePath("/dashboard/tasks");
  return {
    success: true,
    data: {
      board: {
        id: board.id as string,
        name: board.name as string,
        projectName: project.name as string,
      },
    },
  };
}

export async function createProjectTaskAction(input: {
  boardId: string;
  title: string;
  assignedToLabel?: string;
}): Promise<
  | { success: true; data: { task: ProjectTaskView } }
  | { success: false; error: string }
> {
  const ctx = await businessContext();
  if (!ctx) return { success: false, error: "No business found" };

  const { data, error } = await ctx.supabase
    .from("project_tasks")
    .insert({
      business_id: ctx.businessId,
      board_id: input.boardId,
      title: input.title,
      status: "todo",
      priority: "medium",
      description: input.assignedToLabel
        ? `Assigned to: ${input.assignedToLabel}`
        : null,
    })
    .select("*")
    .single();

  if (error || !data) return { success: false, error: error?.message ?? "Task create failed" };

  revalidatePath("/dashboard/tasks");
  return {
    success: true,
    data: {
      task: {
        id: data.id as string,
        boardId: data.board_id as string | null,
        title: data.title as string,
        description: data.description as string | null,
        status: data.status as ProjectTaskView["status"],
        priority: data.priority as string,
        assignedTo: input.assignedToLabel ?? null,
      },
    },
  };
}

export async function moveProjectTaskAction(
  taskId: string,
  status: ProjectTaskView["status"],
): Promise<{ success: true } | { success: false; error: string }> {
  const ctx = await businessContext();
  if (!ctx) return { success: false, error: "No business found" };

  const { error } = await ctx.supabase
    .from("project_tasks")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", taskId)
    .eq("business_id", ctx.businessId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/tasks");
  return { success: true };
}
