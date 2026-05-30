"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  Copy,
  Loader2,
  Pause,
  Play,
  Plus,
  Sparkles,
  Trash2,
  Workflow as WorkflowIcon,
} from "lucide-react";

import {
  bootstrapBusinessSystemAction,
  createWorkflowFromTemplateAction,
  deleteWorkflowAction,
  duplicateWorkflowAction,
  generateWorkflowWithAiAction,
  updateWorkflowStatusAction,
} from "@/actions/workflows.actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SYSTEM_WORKFLOW_TEMPLATES } from "@/lib/workflows/workflow-templates";
import { cn } from "@/lib/utils";
import type { DiazitesWorkflowRow, WorkflowDashboardStats } from "@/types/diazites-platform";

type WorkflowRunRow = {
  id: string;
  status: string;
  started_at: string;
  diazites_workflows?: { name: string } | null;
};

type WorkflowsHubClientProps = {
  workflows: DiazitesWorkflowRow[];
  stats: WorkflowDashboardStats;
  recentRuns: WorkflowRunRow[];
};

const STAT_CARDS: Array<{ key: keyof WorkflowDashboardStats; label: string }> = [
  { key: "active", label: "Active workflows" },
  { key: "draft", label: "Draft workflows" },
  { key: "paused", label: "Paused workflows" },
  { key: "completedRuns", label: "Completed runs" },
  { key: "failedRuns", label: "Failed runs" },
  { key: "leadsInWorkflows", label: "Leads in workflows" },
];

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    draft: "bg-slate-500/15 text-slate-300 border-slate-500/30",
    paused: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    archived: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  };
  return cn("rounded-full border px-2 py-0.5 text-xs capitalize", styles[status] ?? styles.draft);
}

export function WorkflowsHubClient({ workflows, stats, recentRuns }: WorkflowsHubClientProps) {
  const [aiOpen, setAiOpen] = useState(false);
  const [bootstrapOpen, setBootstrapOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [bootstrapGoal, setBootstrapGoal] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function runAiGenerate() {
    startTransition(async () => {
      const res = await generateWorkflowWithAiAction(aiPrompt);
      if (!res.success) {
        setMessage(res.error);
        return;
      }
      setMessage(`Created workflow "${res.data.name}"`);
      setAiOpen(false);
      setAiPrompt("");
    });
  }

  function runBootstrap() {
    startTransition(async () => {
      const res = await bootstrapBusinessSystemAction(bootstrapGoal);
      setMessage(res.success ? res.data.message : res.error);
      if (res.success) setBootstrapOpen(false);
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <Button
            className="rounded-xl"
            onClick={() => {
              setAiOpen(true);
              setMessage("");
            }}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Generate with AI
          </Button>
          <Button
            variant="outline"
            className="rounded-xl border-white/10"
            onClick={() => setBootstrapOpen(true)}
          >
            <WorkflowIcon className="mr-2 h-4 w-4" />
            Build business system
          </Button>
        </div>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {STAT_CARDS.map(({ key, label }) => (
          <Card key={key} className="border-white/[0.06] bg-white/[0.02]">
            <CardHeader className="pb-1">
              <CardDescription className="text-xs">{label}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {key === "conversionRate"
                  ? `${Math.round(stats.conversionRate * 100)}%`
                  : key === "revenueAttributed"
                    ? `$${stats.revenueAttributed.toLocaleString()}`
                    : stats[key]}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle>Your workflows</CardTitle>
            <CardDescription>Create, test, activate, and manage native Diazites automations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {workflows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No workflows yet. Use a template or Generate with AI to get started.
              </p>
            ) : (
              workflows.map((wf) => (
                <div
                  key={wf.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                >
                  <div>
                    <Link
                      href={`/dashboard/workflows/${wf.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {wf.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {wf.trigger_type ?? "manual"} · {wf.description?.slice(0, 80) ?? "No description"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={statusBadge(wf.status)}>{wf.status}</span>
                    <Link
                      href={`/dashboard/workflows/${wf.id}`}
                      className={cn(buttonVariants({ size: "sm", variant: "outline" }), "rounded-lg")}
                    >
                      Edit
                    </Link>
                    {wf.status !== "active" ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            await updateWorkflowStatusAction(wf.id, "active");
                          })
                        }
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            await updateWorkflowStatusAction(wf.id, "paused");
                          })
                        }
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await duplicateWorkflowAction(wf.id);
                        })
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await deleteWorkflowAction(wf.id);
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle>Recent automation activity</CardTitle>
            <CardDescription>Completed and failed workflow runs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentRuns.length === 0 ? (
              <p className="text-sm text-muted-foreground">No runs yet.</p>
            ) : (
              recentRuns.map((run) => (
                <div
                  key={run.id}
                  className="flex justify-between rounded-lg border border-white/[0.06] px-3 py-2 text-sm"
                >
                  <span>{run.diazites_workflows?.name ?? "Workflow"}</span>
                  <span className={run.status === "failed" ? "text-red-400" : "text-emerald-400"}>
                    {run.status}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/[0.06]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Workflow templates
          </CardTitle>
          <CardDescription>Prebuilt automations — one click to add to your account.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SYSTEM_WORKFLOW_TEMPLATES.map((tpl) => (
            <div
              key={tpl.slug}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <p className="font-medium">{tpl.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{tpl.description}</p>
              <Button
                size="sm"
                className="mt-3 rounded-lg"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const res = await createWorkflowFromTemplateAction(tpl.slug);
                    setMessage(res.success ? "Template added" : res.error);
                  })
                }
              >
                Use template
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="border-white/10 bg-zinc-950 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>AI workflow builder</DialogTitle>
            <DialogDescription>
              Describe what you want — Diazites AI generates triggers, steps, SMS copy, and pipeline rules.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Create a workflow that follows up with new leads, books appointments, and reminds my team..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            rows={5}
            className="border-white/10"
          />
          <Button className="rounded-xl" disabled={pending || !aiPrompt.trim()} onClick={runAiGenerate}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Generate workflow
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={bootstrapOpen} onOpenChange={setBootstrapOpen}>
        <DialogContent className="border-white/10 bg-zinc-950 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>What should this business system do?</DialogTitle>
            <DialogDescription>
              Diazites AI will create your CRM pipeline, tags, workflows, calling agent, and project board.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="I want to capture leads from my website, follow up by SMS, book appointments, and alert my team..."
            value={bootstrapGoal}
            onChange={(e) => setBootstrapGoal(e.target.value)}
            rows={5}
            className="border-white/10"
          />
          <Button
            className="rounded-xl"
            disabled={pending || !bootstrapGoal.trim()}
            onClick={runBootstrap}
          >
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Generate full system
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
