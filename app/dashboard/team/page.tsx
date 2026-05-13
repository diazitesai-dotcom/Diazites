import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { TeamManager } from "@/components/team/team-manager";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { createBusinessRepository } from "@/repositories/business.repository";
import {
  createTeamMemberRepository,
  type TeamMemberRow,
} from "@/repositories/cross-cutting.repository";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();

  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);

  if (!business) {
    return (
      <div className="mx-auto max-w-6xl space-y-10">
        <PageHeader
          eyebrow="Team"
          title="Members & roles"
          description="Invite teammates and control what they can see."
        />
        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle>Finish onboarding first</CardTitle>
            <CardDescription>Connect your business profile to manage your team.</CardDescription>
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

  const repo = createTeamMemberRepository(supabase);
  const { data } = await repo.listForBusiness(business.id);
  const members = (data ?? []) as TeamMemberRow[];

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <PageHeader
        eyebrow="Team"
        title="Members & roles"
        description="Invite teammates, set roles, and revoke access. The business owner always retains full control."
      />
      <TeamManager members={members} />
    </div>
  );
}
