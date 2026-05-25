"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { EngineRunCanvas } from "@/components/engine/engine-run-canvas";
import { EngineRunToolbar } from "@/components/engine/engine-run-toolbar";
import { EngineStepper } from "@/components/engine/engine-stepper";
import { PipelineWorkflow } from "@/components/engine/growth-engine-os/pipeline-workflow";
import { cloneEngineRunAction } from "@/services/engine/clone-run-action";
import { Button } from "@/components/ui/button";
import { WORKSPACE_TABS, type WorkspaceTabId } from "@/lib/engine/growth-engine-os-types";
import type { AssetRow, EngineRunRow } from "@/repositories/engine.repository";
import { ENGINE_STEPS, stepIndex } from "@/lib/engine-steps";
import { cn } from "@/lib/utils";

export function EngineWorkspaceClient({
  run,
  assets,
  businessName,
}: {
  run: EngineRunRow;
  assets: AssetRow[];
  businessName: string;
}) {
  const [tab, setTab] = useState<WorkspaceTabId>("overview");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const input = run.input_payload as Record<string, unknown>;

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard/engine"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Growth Engine
        </Link>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-lg border-white/10"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const r = await cloneEngineRunAction(run.id, "same_business_new_offer");
                if (r.success) router.push(`/dashboard/engine/${r.data.runId}`);
              });
            }}
          >
            <Copy className="mr-1 size-3.5" />
            Clone run
          </Button>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-300/90">
          Growth Engine Workspace
        </p>
        <h1 className="text-2xl font-semibold">{businessName}</h1>
        <p className="text-sm text-muted-foreground">
          {ENGINE_STEPS.find((s) => s.key === run.current_step)?.title} · Stage{" "}
          {stepIndex(run.current_step) + 1}/{ENGINE_STEPS.length} · {run.status}
        </p>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-white/10 pb-1">
        {WORKSPACE_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "shrink-0 rounded-t-lg px-3 py-2 text-xs font-medium transition-colors",
              tab === t.id
                ? "bg-violet-500/20 text-violet-100"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <EngineRunToolbar runId={run.id} />

      {tab === "overview" ? (
        <>
          <EngineStepper currentStep={run.current_step} status={run.status} />
          <PipelineWorkflow run={run} />
        </>
      ) : null}

      {tab === "research" || tab === "strategy" || tab === "funnel" || tab === "landing" || tab === "creatives" ? (
        <EngineRunCanvas run={run} assets={assets} businessName={businessName} />
      ) : null}

      {tab === "reasoning" ? (
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-6 text-sm leading-relaxed text-muted-foreground">
          Agents prioritized conversion clarity for {String(input.goal ?? "your offer")} with{" "}
          {String(input.trafficSource ?? "paid + organic")} mix. Approval gates apply before external
          publish.
        </div>
      ) : null}

      {tab === "approvals" ? (
        <div className="rounded-xl border border-white/[0.08] p-6 text-sm">
          <p className="text-muted-foreground">
            Pending approvals appear here when policy requires sign-off.{" "}
            <Link href="/dashboard/approvals" className="text-violet-300 underline">
              Open approvals queue
            </Link>
          </p>
        </div>
      ) : null}

      {tab === "performance" ? (
        <div className="rounded-xl border border-white/[0.08] p-6 text-sm">
          <p className="text-muted-foreground">
            Performance syncs to{" "}
            <Link href="/dashboard/reports" className="text-violet-300 underline">
              Reports
            </Link>{" "}
            and Mission Control KPIs after launch.
          </p>
        </div>
      ) : null}

      {["audiences", "crm", "tracking", "deployments", "optimization"].includes(tab) ? (
        <div className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-muted-foreground">
          {tab} module — connect platforms in Deployment Targets to populate live data.
        </div>
      ) : null}
    </div>
  );
}
