"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  ArrowLeft,
  Mail,
  Plus,
  Tag,
  Trash2,
  Webhook,
  Workflow,
} from "lucide-react";

import {
  addPipelineStageAction,
  addStageAutomationAction,
  attachWorkflowToStageAction,
  deletePipelineStageAction,
  removeStageAutomationAction,
} from "@/actions/pipelines.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { STAGE_AUTOMATION_TYPE_LABELS } from "@/lib/pipelines/default-pipeline";
import { ROUTES } from "@/lib/navigation/platform-nav";
import { WORKFLOW_ACTION_OPTIONS } from "@/lib/workflows/workflow-templates";
import { cn } from "@/lib/utils";
import type { PipelineStageAutomationRow } from "@/repositories/pipeline.repository";
import type {
  DiazitesWorkflowRow,
  PipelineRow,
  PipelineStageRow,
} from "@/types/diazites-platform";

type Props = {
  detail: {
    pipeline: PipelineRow;
    stages: PipelineStageRow[];
    stageAutomations: PipelineStageAutomationRow[];
    workflows: DiazitesWorkflowRow[];
    contactCountByStage: Record<string, number>;
  };
  allWorkflows: DiazitesWorkflowRow[];
};

const QUICK_AUTOMATIONS = [
  { type: "send_email", label: "Send email", icon: Mail },
  { type: "add_tag", label: "Add tag", icon: Tag },
  { type: "create_task", label: "Create task", icon: Plus },
  { type: "trigger_webhook", label: "Webhook", icon: Webhook },
] as const;

function automationsForStage(
  stageId: string,
  rows: PipelineStageAutomationRow[],
): PipelineStageAutomationRow[] {
  return rows.filter((a) => a.pipeline_stage_id === stageId);
}

export function PipelineEditorClient({ detail, allWorkflows }: Props) {
  const [newStageName, setNewStageName] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const { pipeline, stages, stageAutomations, workflows, contactCountByStage } = detail;

  const unattachedWorkflows = allWorkflows.filter(
    (w) => !w.pipeline_stage_id || w.pipeline_id !== pipeline.id,
  );

  function addStage() {
    if (!newStageName.trim()) return;
    startTransition(async () => {
      const res = await addPipelineStageAction({
        pipelineId: pipeline.id,
        name: newStageName.trim(),
      });
      setMessage(res.success ? "Stage added." : res.error);
      if (res.success) setNewStageName("");
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href={ROUTES.automationPipelines}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Pipelines
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{pipeline.name}</h1>
          <p className="text-sm text-muted-foreground">
            Automations run when a contact enters a stage (lead kanban moves, payments, or manual
            moves). Check Agents → pipeline_automation logs.
          </p>
        </div>
        <Link
          href={ROUTES.workflows}
          className="ml-auto inline-flex h-9 items-center rounded-md border border-white/10 px-3 text-sm hover:bg-white/5"
        >
          <Workflow className="mr-2 h-4 w-4" />
          All workflows
        </Link>
      </div>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Input
          className="max-w-xs"
          placeholder="New stage name"
          value={newStageName}
          onChange={(e) => setNewStageName(e.target.value)}
        />
        <Button size="sm" disabled={pending} onClick={addStage}>
          <Plus className="mr-1 h-4 w-4" />
          Add stage
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const autos = automationsForStage(stage.id, stageAutomations);
          const linkedWfs = workflows.filter((w) => w.pipeline_stage_id === stage.id);
          const count = contactCountByStage[stage.id] ?? 0;

          return (
            <Card
              key={stage.id}
              className="min-w-[280px] shrink-0 border-white/[0.06] bg-card/50"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: stage.color ?? "#8b5cf6" }}
                  />
                  <CardTitle className="text-sm font-semibold">{stage.name}</CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const res = await deletePipelineStageAction(stage.id, pipeline.id);
                        setMessage(res.success ? "Stage removed." : res.error);
                      })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <CardDescription className="text-xs capitalize">
                  {stage.stage_type} · {count} contact{count === 1 ? "" : "s"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    On stage enter
                  </p>
                  {autos.length === 0 && linkedWfs.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No automations yet.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {autos.map((a) => (
                        <li
                          key={a.id}
                          className="flex items-center justify-between gap-2 rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-1.5 text-xs"
                        >
                          <span>
                            {STAGE_AUTOMATION_TYPE_LABELS[a.automation_type] ?? a.automation_type}
                            {a.name ? ` · ${a.name}` : ""}
                          </span>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-red-400"
                            disabled={pending}
                            onClick={() =>
                              startTransition(async () => {
                                await removeStageAutomationAction(a.id, pipeline.id);
                              })
                            }
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="space-y-2 border-t border-white/[0.06] pt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Attach workflow
                  </p>
                  <select
                    className="h-8 w-full rounded-md border border-white/10 bg-background/80 px-2 text-xs"
                    defaultValue=""
                    onChange={(e) => {
                      const wfId = e.target.value;
                      if (!wfId) return;
                      startTransition(async () => {
                        const res = await attachWorkflowToStageAction({
                          pipelineId: pipeline.id,
                          stageId: stage.id,
                          workflowId: wfId,
                        });
                        setMessage(res.success ? "Workflow attached." : res.error);
                        e.target.value = "";
                      });
                    }}
                  >
                    <option value="">Select workflow…</option>
                    {unattachedWorkflows.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                    {allWorkflows
                      .filter((w) => !unattachedWorkflows.find((u) => u.id === w.id))
                      .map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} (re-attach)
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-2 border-t border-white/[0.06] pt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Quick actions
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {QUICK_AUTOMATIONS.map((qa) => {
                      const Icon = qa.icon;
                      return (
                        <button
                          key={qa.type}
                          type="button"
                          disabled={pending}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-md border border-white/[0.08] px-2 py-1 text-[10px] hover:bg-white/5",
                          )}
                          onClick={() =>
                            startTransition(async () => {
                              const res = await addStageAutomationAction({
                                pipelineId: pipeline.id,
                                stageId: stage.id,
                                name: qa.label,
                                automationType: qa.type,
                                config: { trigger: "on_stage_enter" },
                              });
                              setMessage(res.success ? `Added ${qa.label}.` : res.error);
                            })
                          }
                        >
                          <Icon className="h-3 w-3" />
                          {qa.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-base">Pipeline ↔ workflow actions</CardTitle>
          <CardDescription>
            Workflows can also move contacts between stages using these actions inside the visual
            builder.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {WORKFLOW_ACTION_OPTIONS.filter((a) =>
            ["move_pipeline_stage", "send_email", "add_tag", "create_task"].includes(
              a.id,
            ),
          ).map((a) => (
            <span
              key={a.id}
              className="rounded-full border border-white/10 px-2 py-1 text-xs text-muted-foreground"
            >
              {a.label}
            </span>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
