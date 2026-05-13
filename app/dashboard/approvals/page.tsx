import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

import { ApprovalsList } from "@/components/approvals/approvals-list";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { createBusinessRepository } from "@/repositories/business.repository";
import {
  type ApprovalRow,
  createApprovalRepository,
} from "@/repositories/cross-cutting.repository";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();

  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);

  if (!business) {
    return (
      <div className="mx-auto max-w-6xl space-y-10">
        <PageHeader
          eyebrow="Approvals"
          title="Decision queue"
          description="Approve or reject the items the engine routes to you."
        />
        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle>Finish onboarding first</CardTitle>
            <CardDescription>Connect your business profile to manage approvals.</CardDescription>
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

  const repo = createApprovalRepository(supabase);
  const [pendingRes, recentRes] = await Promise.all([
    repo.listPendingForBusiness(business.id, 50),
    repo.listForBusiness(business.id, 50),
  ]);

  const pending = (pendingRes.data ?? []) as ApprovalRow[];
  const recent = ((recentRes.data ?? []) as ApprovalRow[]).filter(
    (r) => r.state !== "pending",
  );

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <PageHeader
        eyebrow="Approvals"
        title="Decision queue"
        description="Engine launches that failed QA, large budget changes, and other high-stakes decisions land here for human review."
      />

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Pending ({pending.length})
        </h3>
        <ApprovalsList items={pending} />
      </section>

      {recent.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Recently decided
          </h3>
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card/60">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Subject</th>
                  <th className="px-3 py-2 font-medium">State</th>
                  <th className="px-3 py-2 font-medium">Note</th>
                  <th className="px-3 py-2 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id} className="border-t border-border/40">
                    <td className="px-3 py-2 text-xs">
                      <span className="font-mono">{r.subject_kind}</span>
                      <span className="ml-2 text-muted-foreground">
                        {r.subject_id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          r.state === "approved"
                            ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-300"
                            : "rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] text-red-300"
                        }
                      >
                        {r.state}
                      </span>
                    </td>
                    <td className="px-3 py-2 max-w-md truncate text-xs text-muted-foreground">
                      {r.note ?? ""}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {r.decided_at
                        ? formatDistanceToNow(new Date(r.decided_at), { addSuffix: true })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
