"use client";

import { formatDistanceToNow } from "date-fns";
import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, RefreshCw, XCircle, Zap } from "lucide-react";

import {
  runOptimizationNowAction,
  updateDecisionStatusAction,
} from "@/services/optimization/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  EngineDecisionActionKind,
  EngineDecisionRow,
  OptimizationRunRow,
} from "@/repositories/engine-telemetry.repository";

type Props = {
  decisions: EngineDecisionRow[];
  runs: OptimizationRunRow[];
};

const KIND_LABEL: Record<EngineDecisionActionKind, string> = {
  pause_variant: "Pause variant",
  scale_budget: "Scale budget",
  reduce_budget: "Reduce budget",
  swap_headline: "Swap headline",
  rerun_engine: "Re-run engine",
  no_op: "No action needed",
};

export function OptimizationDashboard({ decisions, runs }: Props) {
  const [isPending, startTransition] = useTransition();
  const [banner, setBanner] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  function runNow() {
    setBanner(null);
    startTransition(async () => {
      const result = await runOptimizationNowAction();
      if (result.success) {
        setBanner({
          kind: "ok",
          text: `Ran sweep · ${result.data.eventsConsidered} events · ${result.data.decisionsGenerated} decisions generated.`,
        });
      } else {
        setBanner({ kind: "err", text: result.error });
      }
    });
  }

  function updateDecision(id: string, status: "approved" | "rejected" | "applied") {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("status", status);
    startTransition(async () => {
      await updateDecisionStatusAction(fd);
    });
  }

  const pending = decisions.filter((d) => d.status === "pending");
  const rest = decisions.filter((d) => d.status !== "pending");

  return (
    <div className="space-y-8">
      <Card className="border-white/[0.06]">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Run optimization sweep</CardTitle>
            <CardDescription>
              Analyze the last 24 hours of engagement + spend and generate new decisions. The cron job /api/cron/optimize does this automatically when CRON_SECRET is configured.
            </CardDescription>
          </div>
          <Button size="sm" onClick={runNow} disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 size-3.5 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="mr-2 size-3.5" aria-hidden />
            )}
            Run now
          </Button>
        </CardHeader>
        {banner ? (
          <CardContent>
            <p
              className={`rounded-lg border px-3 py-2 text-xs ${
                banner.kind === "ok"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-red-500/30 bg-red-500/10 text-red-300"
              }`}
            >
              {banner.text}
            </p>
          </CardContent>
        ) : null}
      </Card>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Pending decisions ({pending.length})
        </h3>
        {pending.length === 0 ? (
          <Card className="border-dashed border-white/[0.08]">
            <CardContent className="py-8 text-sm text-muted-foreground">
              No pending decisions. Either everything looks healthy or no data has been collected yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {pending.map((d) => (
              <DecisionCard
                key={d.id}
                decision={d}
                onApprove={() => updateDecision(d.id, "approved")}
                onReject={() => updateDecision(d.id, "rejected")}
                onApply={() => updateDecision(d.id, "applied")}
                disabled={isPending}
              />
            ))}
          </div>
        )}
      </section>

      {rest.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Recent decisions
          </h3>
          <div className="grid gap-2">
            {rest.slice(0, 20).map((d) => (
              <div
                key={d.id}
                className="rounded-xl border border-border/60 bg-card/40 px-4 py-3 text-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate">
                    <span className="font-mono text-xs text-muted-foreground">
                      {KIND_LABEL[d.action_kind] ?? d.action_kind}
                    </span>{" "}
                    · {d.rationale}
                  </p>
                  <span className={decisionStatusPill(d.status)}>{d.status}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {runs.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Sweep history
          </h3>
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card/60">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Window</th>
                  <th className="px-3 py-2 text-right font-medium">Events</th>
                  <th className="px-3 py-2 text-right font-medium">Decisions</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id} className="border-t border-border/40">
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {new Date(r.window_started_at).toLocaleString()} → {new Date(r.window_ended_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.events_considered}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.decisions_generated}</td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          r.status === "success"
                            ? "inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-300"
                            : r.status === "error"
                            ? "inline-flex rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] text-red-300"
                            : "inline-flex rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                        }
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function DecisionCard({
  decision,
  onApprove,
  onReject,
  onApply,
  disabled,
}: {
  decision: EngineDecisionRow;
  onApprove: () => void;
  onReject: () => void;
  onApply: () => void;
  disabled: boolean;
}) {
  return (
    <Card className="border-white/[0.06]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Zap className="size-3.5 text-violet-300" aria-hidden />
            {KIND_LABEL[decision.action_kind] ?? decision.action_kind}
          </CardTitle>
          <span className="text-[11px] text-muted-foreground">
            {formatDistanceToNow(new Date(decision.created_at), { addSuffix: true })}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{decision.rationale}</p>
        {Object.keys(decision.action_payload).length > 0 ? (
          <pre className="mt-2 overflow-x-auto rounded-lg bg-muted/30 p-2 font-mono text-[11px] text-muted-foreground">
            {JSON.stringify(decision.action_payload, null, 2)}
          </pre>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={onApply} disabled={disabled || decision.action_kind === "no_op"}>
            <CheckCircle2 className="mr-1 size-3.5" aria-hidden /> Mark applied
          </Button>
          <Button size="sm" variant="outline" onClick={onApprove} disabled={disabled}>
            Approve
          </Button>
          <Button size="sm" variant="ghost" onClick={onReject} disabled={disabled}>
            <XCircle className="mr-1 size-3.5" aria-hidden /> Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function decisionStatusPill(status: string): string {
  const base = "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ";
  switch (status) {
    case "approved":
      return base + "bg-emerald-500/15 text-emerald-300";
    case "applied":
      return base + "bg-violet-500/15 text-violet-300";
    case "rejected":
      return base + "bg-slate-500/15 text-slate-300";
    case "errored":
      return base + "bg-red-500/15 text-red-300";
    default:
      return base + "bg-muted text-muted-foreground";
  }
}
