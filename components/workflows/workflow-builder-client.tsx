"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowLeft, GitBranch, Loader2, Play, Save, Sparkles } from "lucide-react";

import {
  generateWorkflowWithAiAction,
  saveWorkflowDefinitionAction,
  updateWorkflowStatusAction,
} from "@/actions/workflows.actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  WORKFLOW_ACTION_OPTIONS,
  WORKFLOW_TRIGGER_OPTIONS,
} from "@/lib/workflows/workflow-templates";
import { cn } from "@/lib/utils";
import type { DiazitesWorkflowRow, WorkflowDefinition, WorkflowNode } from "@/types/diazites-platform";

type WorkflowBuilderClientProps = {
  workflow: DiazitesWorkflowRow;
};

const NODE_COLORS: Record<string, string> = {
  trigger: "border-cyan-500/40 bg-cyan-500/10",
  action: "border-violet-500/40 bg-violet-500/10",
  wait: "border-amber-500/40 bg-amber-500/10",
  branch: "border-pink-500/40 bg-pink-500/10",
  condition: "border-slate-500/40 bg-slate-500/10",
};

export function WorkflowBuilderClient({ workflow }: WorkflowBuilderClientProps) {
  const initialDef = (workflow.definition ?? { nodes: [], edges: [] }) as WorkflowDefinition;
  const [name, setName] = useState(workflow.name);
  const [definition, setDefinition] = useState<WorkflowDefinition>(initialDef);
  const [aiPrompt, setAiPrompt] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function addNode(type: WorkflowNode["type"]) {
    const id = `node-${Date.now()}`;
    const lastX = definition.nodes.length
      ? Math.max(...definition.nodes.map((n) => n.x)) + 200
      : 80;
    const label =
      type === "trigger"
        ? "New trigger"
        : type === "wait"
          ? "Wait step"
          : type === "branch"
            ? "If / else"
            : "New action";
    setDefinition({
      ...definition,
      nodes: [
        ...definition.nodes,
        {
          id,
          type,
          label,
          x: lastX,
          y: 120 + (definition.nodes.length % 3) * 60,
          config: type === "trigger" ? { triggerType: "new_lead_created" } : { actionType: "send_email" },
        },
      ],
    });
  }

  function save() {
    startTransition(async () => {
      const res = await saveWorkflowDefinitionAction(workflow.id, definition, name);
      setMessage(res.success ? "Saved" : res.error);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard/workflows"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-lg")}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Workflows
        </Link>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="max-w-md border-white/10"
        />
        <Button className="rounded-xl" disabled={pending} onClick={save}>
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save
        </Button>
        <Button
          variant="outline"
          className="rounded-xl border-white/10"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await updateWorkflowStatusAction(workflow.id, "active");
            })
          }
        >
          <Play className="mr-2 h-4 w-4" />
          Activate
        </Button>
        {message ? <span className="text-sm text-muted-foreground">{message}</span> : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <Card className="border-white/[0.06] h-fit">
          <CardHeader>
            <CardTitle className="text-base">Add steps</CardTitle>
            <CardDescription>Drag-free builder — click to add nodes.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button size="sm" variant="outline" className="justify-start rounded-lg" onClick={() => addNode("trigger")}>
              Add trigger
            </Button>
            <Button size="sm" variant="outline" className="justify-start rounded-lg" onClick={() => addNode("action")}>
              Add action
            </Button>
            <Button size="sm" variant="outline" className="justify-start rounded-lg" onClick={() => addNode("wait")}>
              Add wait
            </Button>
            <Button size="sm" variant="outline" className="justify-start rounded-lg" onClick={() => addNode("branch")}>
              <GitBranch className="mr-2 h-4 w-4" />
              Add branch
            </Button>
          </CardContent>
        </Card>

        <Card className="border-white/[0.06] overflow-hidden">
          <CardHeader>
            <CardTitle>Visual workflow canvas</CardTitle>
            <CardDescription>
              Status: {workflow.status} · Trigger: {workflow.trigger_type ?? "not set"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative min-h-[420px] overflow-auto rounded-xl border border-dashed border-white/10 bg-black/20 p-4">
              {definition.nodes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Add a trigger to start building.</p>
              ) : (
                definition.nodes.map((node) => (
                  <div
                    key={node.id}
                    className={cn(
                      "absolute w-44 rounded-xl border p-3 text-xs shadow-lg",
                      NODE_COLORS[node.type] ?? NODE_COLORS.action,
                    )}
                    style={{ left: node.x, top: node.y }}
                  >
                    <p className="font-semibold capitalize">{node.type}</p>
                    <p className="mt-1 text-foreground/90">{node.label}</p>
                  </div>
                ))
              )}
              {definition.edges.length > 0 ? (
                <p className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                  {definition.edges.length} connections
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/[0.06]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Regenerate with AI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Refine this workflow: add 24h email follow-up and move hot leads to Qualified..."
            rows={3}
            className="border-white/10"
          />
          <Button
            disabled={pending || !aiPrompt.trim()}
            onClick={() =>
              startTransition(async () => {
                const res = await generateWorkflowWithAiAction(aiPrompt);
                setMessage(res.success ? `Created "${res.data.name}" — open from workflows list` : res.error);
              })
            }
          >
            Generate new workflow from prompt
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-base">Trigger reference</CardTitle>
          </CardHeader>
          <CardContent className="max-h-48 space-y-1 overflow-auto text-xs text-muted-foreground">
            {WORKFLOW_TRIGGER_OPTIONS.map((t) => (
              <p key={t.id}>{t.label}</p>
            ))}
          </CardContent>
        </Card>
        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-base">Action reference</CardTitle>
          </CardHeader>
          <CardContent className="max-h-48 space-y-1 overflow-auto text-xs text-muted-foreground">
            {WORKFLOW_ACTION_OPTIONS.map((a) => (
              <p key={a.id}>{a.label}</p>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
