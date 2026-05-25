"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

import { EngineDeployAgentsButton } from "@/components/engine/engine-deploy-agents-button";
import { SeedTestLaunchButton } from "@/components/engine/seed-test-launch-button";
import { AgentStackSection } from "@/components/engine/growth-engine-os/agent-stack-section";
import { BusinessIntakeForm } from "@/components/engine/growth-engine-os/business-intake-form";
import { CostForecastSection } from "@/components/engine/growth-engine-os/cost-forecast-section";
import { DeploymentTargetsSection } from "@/components/engine/growth-engine-os/deployment-targets-section";
import { ExecutionPolicySection } from "@/components/engine/growth-engine-os/execution-policy-section";
import { GrowthEngineOsProvider } from "@/components/engine/growth-engine-os/growth-engine-os-provider";
import { LiveRunProgress } from "@/components/engine/growth-engine-os/live-run-progress";
import { MissionControlBridge } from "@/components/engine/growth-engine-os/mission-control-bridge";
import { PipelineWorkflow } from "@/components/engine/growth-engine-os/pipeline-workflow";
import { RunPerformanceCards } from "@/components/engine/growth-engine-os/run-performance-cards";
import type { AssetRow, EngineRunRow } from "@/repositories/engine.repository";
import { EngineRunCanvas } from "@/components/engine/engine-run-canvas";

export function GrowthEngineOsClient({
  businessName,
  businessDefaults,
  connectedIds,
  activeRun,
  history,
  assets,
  missionFlags,
  isDev,
}: {
  businessName: string;
  businessDefaults: {
    websiteUrl?: string | null;
    location?: string | null;
    niche?: string | null;
    budget?: number | null;
  };
  connectedIds: string[];
  activeRun: EngineRunRow | null;
  history: EngineRunRow[];
  assets: AssetRow[];
  missionFlags: {
    hasMeta: boolean;
    hasGoogle: boolean;
    trackingOk: boolean;
    crmConnected: boolean;
    visitorsForRetargeting: number;
  };
  isDev: boolean;
}) {
  return (
    <GrowthEngineOsProvider
      connectedIds={connectedIds}
      defaults={{
        websiteUrl: businessDefaults.websiteUrl ?? "",
        businessName,
        niche: businessDefaults.niche ?? "",
        location: businessDefaults.location ?? "",
        monthlyBudget: businessDefaults.budget ?? null,
      }}
    >
      <div className="mx-auto max-w-7xl space-y-10 pb-24">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300/90">
              AI Growth OS
            </p>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Growth Engine
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Configure your stack, select platforms, set policy, and launch the 8-stage AI marketing
              pipeline — wired into Mission Control.
            </p>
          </div>
          <EngineDeployAgentsButton className="mission-shimmer-btn rounded-xl" />
        </header>

        <MissionControlBridge {...missionFlags} />

        {activeRun ? (
          <>
            <LiveRunProgress run={activeRun} businessName={businessName} />
            <PipelineWorkflow run={activeRun} />
            <EngineRunCanvas run={activeRun} assets={assets} businessName={businessName} />
          </>
        ) : (
          <>
            <PipelineWorkflow run={null} />

            <section className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-card/90 to-card/60 p-6 shadow-lg">
              <div className="mb-6 flex items-center gap-2">
                <Sparkles className="size-5 text-violet-300" />
                <h2 className="text-lg font-semibold">Business context</h2>
              </div>
              <BusinessIntakeForm />
              {isDev ? (
                <div className="mt-6 rounded-xl border border-dashed border-white/[0.08] p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Dev shortcut</p>
                  <div className="mt-2">
                    <SeedTestLaunchButton />
                  </div>
                </div>
              ) : null}
            </section>

            <DeploymentTargetsSection />
            <AgentStackSection />
            <ExecutionPolicySection />
            <CostForecastSection />
          </>
        )}

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Recent runs
            </h2>
            <Link href="/dashboard" className="text-xs text-violet-300 hover:underline">
              Mission Control →
            </Link>
          </div>
          <RunPerformanceCards runs={history} businessName={businessName} />
        </section>
      </div>
    </GrowthEngineOsProvider>
  );
}
