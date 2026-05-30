import { notFound } from "next/navigation";

import { PipelineEditorClient } from "@/components/automations/pipeline-editor-client";
import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createWorkflowRepository } from "@/repositories/workflow.repository";
import { createBusinessRepository } from "@/repositories/business.repository";
import { loadPipelineDetail } from "@/services/pipelines/pipeline.service";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ pipelineId: string }> };

export default async function PipelineEditorPage({ params }: Props) {
  const user = await requireAuth();
  const { pipelineId } = await params;
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business) notFound();

  const detail = await loadPipelineDetail(supabase, business.id, pipelineId);
  if (!detail) notFound();

  const wfRepo = createWorkflowRepository(supabase);
  const { data: allWorkflows } = await wfRepo.listForBusiness(business.id);

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 pb-16">
      <PipelineEditorClient detail={detail} allWorkflows={allWorkflows ?? []} />
    </div>
  );
}
