import { notFound } from "next/navigation";

import { EngineRunCanvas } from "@/components/engine/engine-run-canvas";
import { EngineRunSaveForm } from "@/components/engine/engine-run-save-form";
import { EngineRunToolbar } from "@/components/engine/engine-run-toolbar";
import { EngineStepper } from "@/components/engine/engine-stepper";
import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";
import { createEngineRepository, type AssetRow } from "@/repositories/engine.repository";
import { ENGINE_STEPS, stepIndex } from "@/services/engine/orchestrator.service";
import { getEngineRunForOwner } from "@/services/engine/run-management.service";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ runId: string }> };

export default async function EngineRunDetailPage({ params }: PageProps) {
  const { runId } = await params;
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();

  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business) notFound();

  const result = await getEngineRunForOwner(supabase, runId, user.id);
  if (!result.success || !result.data) notFound();

  const run = result.data;
  const engineRepo = createEngineRepository(supabase);
  const { data: assetRows } = await engineRepo.listAssetsForRun(run.id);
  const assets = (assetRows ?? []) as AssetRow[];
  const input = run.input_payload as Record<string, unknown>;

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <PageHeader
        eyebrow="Growth Engine"
        title={ENGINE_STEPS.find((s) => s.key === run.current_step)?.title ?? "Engine run"}
        description={`Status: ${run.status} · Stage ${stepIndex(run.current_step) + 1} of ${ENGINE_STEPS.length}`}
      />

      <EngineRunToolbar runId={run.id} />

      <EngineStepper currentStep={run.current_step} status={run.status} />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <EngineRunSaveForm runId={run.id} input={input} />
        <EngineRunCanvas run={run} assets={assets} businessName={business.name} />
      </div>
    </div>
  );
}
