"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Copy, ExternalLink, Rocket, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import {
  archiveEngineRunAction,
  deleteEngineRunAction,
} from "@/services/engine/run-actions";
import { cloneEngineRunAction } from "@/services/engine/clone-run-action";
import { Button } from "@/components/ui/button";
import { buildRunPerformanceCards } from "@/lib/engine/build-run-performance-cards";
import type { EngineRunRow } from "@/repositories/engine.repository";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  running: "text-amber-300",
  needs_approval: "text-violet-300",
  launched: "text-emerald-300",
  failed: "text-rose-300",
  archived: "text-muted-foreground",
};

export function RunPerformanceCards({ runs, businessName }: { runs: EngineRunRow[]; businessName: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const cards = buildRunPerformanceCards(runs, businessName);

  if (!cards.length) {
    return (
      <p className="rounded-xl border border-dashed border-white/15 py-12 text-center text-sm text-muted-foreground">
        No runs yet — configure your stack and launch above.
      </p>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {cards.map((card) => (
        <article
          key={card.id}
          className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-card/90 to-card/60 p-5 shadow-lg transition-shadow hover:shadow-[0_12px_40px_-12px_rgba(139,92,246,0.25)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15">
                <Rocket className="size-4 text-violet-200" />
              </span>
              <div>
                <p className="font-semibold">{card.businessName}</p>
                {card.websiteUrl ? (
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">{card.websiteUrl}</p>
                ) : null}
                <p className={cn("mt-1 text-xs font-medium uppercase", STATUS_STYLE[card.status] ?? "")}>
                  {card.status.replace(/_/g, " ")}
                </p>
              </div>
            </div>
            <span className="text-xs tabular-nums text-muted-foreground">{card.stageProgress}%</span>
          </div>

          <div className="mt-3 h-1.5 rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-violet-500/70"
              style={{ width: `${card.stageProgress}%` }}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <Metric label="Leads" value={String(card.leads)} />
            <Metric label="CPL" value={card.cpl != null ? `$${card.cpl}` : "—"} />
            <Metric label="CVR" value={card.conversionRate ?? "—"} />
            <Metric label="Pipeline" value={card.roasOrPipeline ?? "—"} />
          </div>

          <p className="mt-3 text-[10px] text-muted-foreground">
            Platforms: {card.platforms.join(", ") || "—"} · Budget:{" "}
            {card.budget != null ? `$${card.budget}/mo` : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground">
            Started {formatDistanceToNow(new Date(card.startedAt), { addSuffix: true })} · Last{" "}
            {formatDistanceToNow(new Date(card.lastActivity), { addSuffix: true })}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/dashboard/engine/${card.id}`}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 text-xs font-medium text-violet-100"
            >
              <ExternalLink className="size-3.5" />
              Open workspace
            </Link>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-lg border-white/10 text-xs"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  const r = await cloneEngineRunAction(card.id, "same_business_new_offer");
                  if (r.success) router.push(`/dashboard/engine/${r.data.runId}`);
                  router.refresh();
                });
              }}
            >
              <Copy className="mr-1 size-3" />
              Clone
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              disabled={pending}
              onClick={() => {
                if (!confirm("Archive this run?")) return;
                startTransition(async () => {
                  await archiveEngineRunAction(card.id);
                  router.refresh();
                });
              }}
            >
              Archive
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-rose-300"
              disabled={pending}
              onClick={() => {
                if (!confirm("Delete permanently?")) return;
                startTransition(async () => {
                  await deleteEngineRunAction(card.id);
                  router.refresh();
                });
              }}
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1.5">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="font-semibold tabular-nums">{value}</p>
    </div>
  );
}
