import Link from "next/link";
import { notFound } from "next/navigation";

import { WorkflowBuilderClient } from "@/components/workflows/workflow-builder-client";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { createBusinessRepository } from "@/repositories/business.repository";
import { createWorkflowRepository } from "@/repositories/workflow.repository";
import type { DiazitesWorkflowRow } from "@/types/diazites-platform";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ workflowId: string }> };

export default async function WorkflowBuilderPage({ params }: Props) {
  const { workflowId } = await params;
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <Link href="/onboarding" className={cn(buttonVariants(), "rounded-xl")}>
          Complete onboarding
        </Link>
      </div>
    );
  }

  const repo = createWorkflowRepository(supabase);
  const { data: workflow, error } = await repo.getById(workflowId, business.id);
  if (error || !workflow) notFound();

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        eyebrow="Workflow builder"
        title={(workflow as DiazitesWorkflowRow).name}
        description="Visual drag-and-drop automation — attach to pipelines, tags, and AI agents."
      />
      <WorkflowBuilderClient workflow={workflow as DiazitesWorkflowRow} />
    </div>
  );
}
