import { LeadsBoard } from "@/components/leads/leads-board";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";
import { getLeadsForBoard } from "@/services/leads/lead.service";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function LeadsManagerPage() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);

  if (!business) {
    return (
      <div className="mx-auto max-w-6xl space-y-10">
        <PageHeader
          eyebrow="Leads OS"
          title="Leads OS"
          description="Everything after capture — inbox, CRM, pipelines, conversations, follow-up, and attribution."
        />
        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-lg">No business yet</CardTitle>
            <CardDescription>Complete onboarding to load your pipeline.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/onboarding"
              className={cn(buttonVariants({ variant: "default" }), "rounded-xl")}
            >
              Onboarding
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const result = await getLeadsForBoard(supabase, user.id, business.id);
  const leads = result.success && result.data ? result.data : [];

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <PageHeader
        eyebrow="Leads OS"
        title="Lead & revenue operations"
        description="Inbox, CRM, scoring, pipelines, SMS, email, bookings, follow-up, attribution, and AI qualification."
      />
      <LeadsBoard leads={leads} />
    </div>
  );
}
