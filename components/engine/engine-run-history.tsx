"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ExternalLink, Rocket, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import {
  archiveEngineRunAction,
  deleteEngineRunAction,
} from "@/services/engine/run-actions";
import { Button } from "@/components/ui/button";
import type { EngineRunRow, EngineStep } from "@/repositories/engine.repository";
import { ENGINE_STEPS, labelForEngineStep, stepIndex } from "@/lib/engine-steps";

const STATUS_LABEL: Record<string, string> = {
  running: "In progress",
  needs_approval: "Needs approval",
  launched: "Launched",
  failed: "Failed",
  archived: "Archived",
};

export function EngineRunHistory({ runs }: { runs: EngineRunRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onArchive(runId: string) {
    if (!confirm("Archive this run?")) return;
    startTransition(async () => {
      await archiveEngineRunAction(runId);
      router.refresh();
    });
  }

  function onDelete(runId: string) {
    if (!confirm("Delete this run permanently?")) return;
    startTransition(async () => {
      await deleteEngineRunAction(runId);
      router.refresh();
    });
  }

  if (runs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No runs yet â€” start one above to see it here.
      </p>
    );
  }

  return (
    <div className="grid gap-2">
      {runs.map((run) => (
        <div
          key={run.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/60 px-4 py-3 text-sm"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-200">
              <Rocket className="size-3.5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="font-medium">
                {labelForEngineStep(run.current_step)}
                <span className="ml-2 text-xs text-muted-foreground">
                  {STATUS_LABEL[run.status] ?? run.status}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                Started {formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Stage {stepIndex(run.current_step) + 1}/{ENGINE_STEPS.length}
            </span>
            <Link
              href={`/dashboard/engine/${run.id}`}
              className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-border/60 bg-background/80 px-3 text-xs font-medium hover:bg-white/[0.04]"
            >
              <ExternalLink className="size-3.5" />
              Open
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => onArchive(run.id)}
            >
              Archive
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-300"
              disabled={pending}
              onClick={() => onDelete(run.id)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

