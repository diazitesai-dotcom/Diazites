"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { GitBranch, Plus, Target, Trash2 } from "lucide-react";

import { createPipelineAction, deletePipelineAction } from "@/actions/pipelines.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/lib/navigation/platform-nav";
import type { PipelineRow } from "@/types/diazites-platform";

type Props = {
  pipelines: PipelineRow[];
  stageCounts: Record<string, number>;
};

export function PipelinesHubClient({ pipelines, stageCounts }: Props) {
  const [name, setName] = useState("Sales Pipeline");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function onCreate() {
    startTransition(async () => {
      const res = await createPipelineAction(name);
      setMessage(res.success ? "Pipeline created with default stages." : res.error);
    });
  }

  function onDelete(id: string) {
    if (!confirm("Delete this pipeline and all stage automations?")) return;
    startTransition(async () => {
      const res = await deletePipelineAction(id);
      setMessage(res.success ? "Pipeline deleted." : res.error);
    });
  }

  return (
    <div className="space-y-6">
      <Card className="border-violet-500/20 bg-violet-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-5 w-5 text-violet-400" />
            Pipeline builder (GHL-style)
          </CardTitle>
          <CardDescription>
            Create pipelines with stages, attach workflows on stage entry, and connect email,
            tags, and tasks — the same automation model as GoHighLevel, native to Diazites.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1 space-y-1">
            <label className="text-xs text-muted-foreground">New pipeline name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sales Pipeline" />
          </div>
          <Button disabled={pending} onClick={onCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create pipeline
          </Button>
        </CardContent>
      </Card>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      {pipelines.length === 0 ? (
        <Card className="border-dashed border-white/[0.08]">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No pipelines yet. Create one to define stages and wire automations per stage.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {pipelines.map((p) => (
            <Card key={p.id} className="border-white/[0.06]">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{p.name}</CardTitle>
                    {p.is_default ? (
                      <span className="text-xs text-violet-400">Default pipeline</span>
                    ) : null}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => onDelete(p.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription className="line-clamp-2">
                  {p.description ?? `${stageCounts[p.id] ?? 0} stages`}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Link
                  href={`${ROUTES.automationPipelines}/${p.id}`}
                  className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <GitBranch className="mr-2 h-4 w-4" />
                  Edit stages & automations
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
