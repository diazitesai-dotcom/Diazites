import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Activity, Rocket, Sparkles } from "lucide-react";

import { AdvanceRunButton } from "@/components/engine/advance-run-button";
import { EngineRunCanvas } from "@/components/engine/engine-run-canvas";
import { EngineStepper } from "@/components/engine/engine-stepper";
import { SeedTestLaunchButton } from "@/components/engine/seed-test-launch-button";
import { StartRunForm } from "@/components/engine/start-run-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { createBusinessRepository } from "@/repositories/business.repository";
import {
  createEngineRepository,
  type AssetRow,
  type EngineStep,
} from "@/repositories/engine.repository";
import {
  ENGINE_STEPS,
  getActiveEngineRun,
  isFinalStep,
  listEngineRuns,
  stepIndex,
} from "@/services/engine/orchestrator.service";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  running: "In progress",
  needs_approval: "Needs approval",
  launched: "Launched",
  failed: "Failed",
  archived: "Archived",
};

export default async function EnginePage() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();

  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);

  if (!business) {
    return (
      <div className="mx-auto max-w-6xl space-y-10">
        <PageHeader
          eyebrow="Growth Engine"
          title="AI Marketing Operating System"
          description="The 8-stage pipeline from business input to launched campaign."
        />
        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-lg">Finish onboarding first</CardTitle>
            <CardDescription>
              Connect your business profile so the engine has the inputs it needs to research, generate, and launch.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/onboarding"
              className={cn(buttonVariants({ variant: "default" }), "rounded-xl")}
            >
              Go to onboarding
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [activeResult, historyResult] = await Promise.all([
    getActiveEngineRun(supabase, business.id),
    listEngineRuns(supabase, business.id, 10),
  ]);

  const activeRun = activeResult.success ? activeResult.data : null;
  const history = historyResult.success ? historyResult.data : [];
  const isDev = process.env.NODE_ENV !== "production";

  let assets: AssetRow[] = [];
  if (activeRun) {
    const engineRepo = createEngineRepository(supabase);
    const { data: assetRows } = await engineRepo.listAssetsForRun(activeRun.id);
    assets = (assetRows ?? []) as AssetRow[];
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <PageHeader
        eyebrow="Growth Engine"
        title="AI Marketing Operating System"
        description="Input → Research → Strategy → Funnel → Generation → Variants → Scoring → Launch. The same 8-stage pipeline shown on the AIWORKERS map, applied to your business."
      />

      {activeRun ? (
        <>
          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Active run
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight">
                  Stage {stepIndex(activeRun.current_step) + 1} of {ENGINE_STEPS.length}
                  <span className="ml-2 text-muted-foreground">
                    · {labelForStep(activeRun.current_step)}
                  </span>
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Started {formatDistanceToNow(new Date(activeRun.created_at), { addSuffix: true })}
                  {" · "}
                  Status: {STATUS_LABEL[activeRun.status] ?? activeRun.status}
                </p>
              </div>
              <div className="flex flex-col items-end gap-3">
                <AdvanceRunButton
                  runId={activeRun.id}
                  isFinal={isFinalStep(activeRun.current_step)}
                />
                {isDev ? <SeedTestLaunchButton /> : null}
              </div>
            </div>
            <EngineStepper
              currentStep={activeRun.current_step}
              status={activeRun.status}
            />
          </section>

          <EngineRunCanvas
            run={activeRun}
            assets={assets}
            businessName={business.name}
          />
        </>
      ) : (
        <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <Card className="border-white/[0.06]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="size-4 text-violet-300" aria-hidden />
                Start a new Growth Engine run
              </CardTitle>
              <CardDescription>
                We&apos;ll walk through the 8 stages — Phase 1 ships the scaffold; Phase 2+ wires real AI generation into each step.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <StartRunForm
                defaults={{
                  websiteUrl: business.website,
                  location: business.city_state,
                  budget: business.monthly_budget ?? null,
                }}
              />
              {isDev ? (
                <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Dev shortcut
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Skip to Stage 7 with a hand-crafted winner so you can test
                    the Launch System without running the full AI pipeline.
                  </p>
                  <div className="mt-3">
                    <SeedTestLaunchButton />
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-white/[0.06]">
            <CardHeader>
              <CardTitle className="text-lg">What the engine does</CardTitle>
              <CardDescription>
                Mirrors the AIWORKERS map: from raw business input to a launched, scored, optimized campaign.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                {ENGINE_STEPS.map((stage) => (
                  <li key={stage.key} className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-[11px] font-semibold text-violet-200">
                      {stage.index}
                    </span>
                    <div>
                      <p className="font-medium text-foreground">{stage.title}</p>
                      <p className="text-xs text-muted-foreground">{stage.subtitle}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Recent runs
          </h3>
          {history.length > 0 ? (
            <span className="text-xs text-muted-foreground">{history.length} total</span>
          ) : null}
        </div>
        {history.length === 0 ? (
          <Card className="border-dashed border-white/[0.08]">
            <CardContent className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
              <Activity className="size-4" aria-hidden />
              No runs yet — start one above to see it here.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-2">
            {history.map((run) => (
              <div
                key={run.id}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-card/60 px-4 py-3 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-violet-500/15 text-violet-200">
                    <Rocket className="size-3.5" aria-hidden />
                  </span>
                  <div>
                    <p className="font-medium">
                      {labelForStep(run.current_step)}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {STATUS_LABEL[run.status] ?? run.status}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Started {formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}
                      {run.launched_at
                        ? ` · launched ${formatDistanceToNow(new Date(run.launched_at), { addSuffix: true })}`
                        : ""}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  Stage {stepIndex(run.current_step) + 1}/{ENGINE_STEPS.length}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function labelForStep(step: EngineStep): string {
  return ENGINE_STEPS.find((s) => s.key === step)?.title ?? step;
}
