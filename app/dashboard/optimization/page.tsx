import Link from "next/link";

import { OptimizationDashboard } from "@/components/optimization/optimization-dashboard";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { createBusinessRepository } from "@/repositories/business.repository";
import {
  createEngineDecisionRepository,
  createOptimizationRunRepository,
  type EngineDecisionRow,
  type OptimizationRunRow,
} from "@/repositories/engine-telemetry.repository";

export const dynamic = "force-dynamic";

export default async function OptimizationPage() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();

  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);

  if (!business) {
    return (
      <div className="mx-auto max-w-6xl space-y-10">
        <PageHeader
          eyebrow="Optimization Loop"
          title="AI-driven recommendations"
          description="The 24-hour optimization sweep distills engagement + spend into clear, actionable decisions."
        />
        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle>Finish onboarding first</CardTitle>
            <CardDescription>Connect your business profile so the loop has signals to analyze.</CardDescription>
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

  const decisionsRepo = createEngineDecisionRepository(supabase);
  const runsRepo = createOptimizationRunRepository(supabase);

  const [decisionsRes, runsRes] = await Promise.all([
    decisionsRepo.listForBusiness(business.id, 100),
    runsRepo.listForBusiness(business.id, 20),
  ]);

  const decisions = (decisionsRes.data ?? []) as EngineDecisionRow[];
  const runs = (runsRes.data ?? []) as OptimizationRunRow[];

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <PageHeader
        eyebrow="Optimization Loop"
        title="AI-driven recommendations"
        description="The 24-hour optimization sweep distills engagement, conversions, and spend into clear, actionable decisions you can approve or apply."
      />
      <OptimizationDashboard decisions={decisions} runs={runs} />
    </div>
  );
}
