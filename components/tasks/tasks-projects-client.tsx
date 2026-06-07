"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";

import {
  createProjectTaskAction,
  createTaskProjectAction,
  moveProjectTaskAction,
} from "@/actions/task-projects.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TaskRecord } from "@/types/platform-growth";
import { cn } from "@/lib/utils";

export type ProjectBoardView = {
  id: string;
  name: string;
  projectName: string;
};

export type ProjectTaskView = {
  id: string;
  boardId: string | null;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done" | "blocked";
  priority: string;
  assignedTo: string | null;
};

const STAGES: Array<{ id: ProjectTaskView["status"]; label: string }> = [
  { id: "todo", label: "To do" },
  { id: "in_progress", label: "In progress" },
  { id: "blocked", label: "Blocked" },
  { id: "done", label: "Done" },
];

type TasksProjectsClientProps = {
  boards: ProjectBoardView[];
  projectTasks: ProjectTaskView[];
  legacyTasks: TaskRecord[];
};

export function TasksProjectsClient({
  boards,
  projectTasks: initialProjectTasks,
  legacyTasks,
}: TasksProjectsClientProps) {
  const [boardsState, setBoardsState] = useState(boards);
  const [projectTasks, setProjectTasks] = useState(initialProjectTasks);
  const [selectedBoardId, setSelectedBoardId] = useState(boards[0]?.id ?? "");
  const [newProjectName, setNewProjectName] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const boardTasks = projectTasks.filter((t) => t.boardId === selectedBoardId);

  function tasksForStage(stage: ProjectTaskView["status"]) {
    return boardTasks.filter((t) => t.status === stage);
  }

  function handleCreateProject() {
    if (!newProjectName.trim()) return;
    startTransition(async () => {
      setError(null);
      const res = await createTaskProjectAction(newProjectName.trim());
      if (!res.success) {
        setError(res.error ?? "Could not create project");
        return;
      }
      setBoardsState((prev) => [...prev, res.data.board]);
      setSelectedBoardId(res.data.board.id);
      setNewProjectName("");
    });
  }

  function handleCreateTask() {
    if (!newTaskTitle.trim() || !selectedBoardId) return;
    startTransition(async () => {
      setError(null);
      const res = await createProjectTaskAction({
        boardId: selectedBoardId,
        title: newTaskTitle.trim(),
        assignedToLabel: assignee.trim() || undefined,
      });
      if (!res.success) {
        setError(res.error ?? "Could not create task");
        return;
      }
      setProjectTasks((prev) => [...prev, res.data.task]);
      setNewTaskTitle("");
      setAssignee("");
    });
  }

  function handleMove(taskId: string, status: ProjectTaskView["status"]) {
    startTransition(async () => {
      const res = await moveProjectTaskAction(taskId, status);
      if (!res.success) {
        setError(res.error ?? "Could not move task");
        return;
      }
      setProjectTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status } : t)),
      );
    });
  }

  return (
    <div className="space-y-8">
      {error ? (
        <p role="alert" className="rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </p>
      ) : null}

      <Card className="border-white/[0.08]">
        <CardHeader>
          <CardTitle className="text-base">Create project</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Input
            placeholder="Project name"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            className="max-w-xs"
          />
          <Button type="button" variant="gradient" onClick={handleCreateProject} disabled={pending}>
            <Plus className="mr-1 size-4" />
            New project
          </Button>
        </CardContent>
      </Card>

      {boardsState.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-2">
            {boardsState.map((b) => (
              <Button
                key={b.id}
                type="button"
                variant={selectedBoardId === b.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedBoardId(b.id)}
              >
                {b.projectName}
              </Button>
            ))}
          </div>

          <Card className="border-white/[0.08]">
            <CardHeader>
              <CardTitle className="text-base">Add task</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="task-title">Task</Label>
                <Input
                  id="task-title"
                  placeholder="Follow up with lead…"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignee">Assign to</Label>
                <Input
                  id="assignee"
                  placeholder="Team member"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                />
              </div>
              <div className="sm:col-span-3">
                <Button type="button" onClick={handleCreateTask} disabled={pending || !selectedBoardId}>
                  Create & assign task
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-4">
            {STAGES.map((stage) => (
              <div key={stage.id} className="rounded-xl border border-white/[0.08] bg-card/40 p-3">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {stage.label}
                </p>
                <ul className="space-y-2">
                  {tasksForStage(stage.id).map((task) => (
                    <li
                      key={task.id}
                      className="rounded-lg border border-white/[0.06] bg-background/60 p-3 text-sm"
                    >
                      <p className="font-medium">{task.title}</p>
                      {task.assignedTo ? (
                        <p className="mt-1 text-xs text-muted-foreground">Assigned: {task.assignedTo}</p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {STAGES.filter((s) => s.id !== task.status).map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            disabled={pending}
                            onClick={() => handleMove(task.id, s.id)}
                            className={cn(
                              "rounded-md border border-white/10 px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground",
                            )}
                          >
                            → {s.label}
                          </button>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Create a project to start assigning tasks.</p>
      )}

      {legacyTasks.length > 0 ? (
        <Card className="border-white/[0.08]">
          <CardHeader>
            <CardTitle className="text-base">Agent-created tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {legacyTasks.map((t) => (
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
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
