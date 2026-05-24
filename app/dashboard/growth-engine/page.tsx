import { GrowthEngineClient } from "@/components/growth-engine/growth-engine-client";
import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";
import { listGrowthEngineRuns } from "@/services/growth-engine/growth-engine.service";

export default async function GrowthEnginePage() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);

  let runs: unknown[] = [];
  if (business) {
    const result = await listGrowthEngineRuns(supabase, user.id, business.id);
    runs = result.success ? result.data : [];
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <PageHeader
        eyebrow="Growth Engine"
        title="8-stage launch system"
        description="URL analysis, campaign creative, funnel blueprint, variant generation, scoring, and launch."
      />
      <GrowthEngineClient initialRuns={runs as never[]} />
    </div>
  );
}
