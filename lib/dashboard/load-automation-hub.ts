import { notFound } from "next/navigation";

import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAutomationRepository } from "@/repositories/automation.repository";
import { createBusinessRepository } from "@/repositories/business.repository";
import { loadPipelinesHub } from "@/services/pipelines/pipeline.service";
import { EVENT_TYPES } from "@/types/backend";

export async function loadAutomationHubData() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business) notFound();

  const automations = createAutomationRepository(supabase);
  const [pipelineData, rulesResult, runsResult] = await Promise.all([
    loadPipelinesHub(supabase, business.id),
    automations.listForBusiness(business.id),
    automations.listRecentRuns(business.id),
  ]);

  return {
    ...pipelineData,
    rules: rulesResult.data ?? [],
    recentRuns: runsResult.data ?? [],
    triggers: Object.values(EVENT_TYPES),
  };
}
