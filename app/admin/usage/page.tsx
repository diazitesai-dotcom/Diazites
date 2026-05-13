import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { createAiUsageRepository, type AiUsageRow } from "@/repositories/ai-usage.repository";

export const dynamic = "force-dynamic";

export default async function AdminUsagePage() {
  const { supabase } = await requireAdmin();

  const repo = createAiUsageRepository(supabase);
  const [aggRes, recentRes] = await Promise.all([
    repo.sumLastNDaysAcrossOrg(30),
    repo.listRecentAcrossOrg(200),
  ]);

  type AggRow = Pick<AiUsageRow, "cost_usd" | "total_tokens" | "status" | "model" | "purpose" | "created_at">;
  const agg = (aggRes.data ?? []) as AggRow[];
  const recent = (recentRes.data ?? []) as AiUsageRow[];

  const totalCost = agg.reduce((s, r) => s + Number(r.cost_usd ?? 0), 0);
  const totalTokens = agg.reduce((s, r) => s + Number(r.total_tokens ?? 0), 0);
  const successCount = agg.filter((r) => r.status === "success").length;
  const errorCount = agg.filter((r) => r.status === "error").length;

  // Breakdown by model
  const modelBreakdown = new Map<string, { count: number; cost: number; tokens: number }>();
  for (const r of agg) {
    const m = r.model;
    const cur = modelBreakdown.get(m) ?? { count: 0, cost: 0, tokens: 0 };
    cur.count += 1;
    cur.cost += Number(r.cost_usd ?? 0);
    cur.tokens += Number(r.total_tokens ?? 0);
    modelBreakdown.set(m, cur);
  }

  // Breakdown by purpose
  const purposeBreakdown = new Map<string, { count: number; cost: number }>();
  for (const r of agg) {
    const p = r.purpose;
    const cur = purposeBreakdown.get(p) ?? { count: 0, cost: 0 };
    cur.count += 1;
    cur.cost += Number(r.cost_usd ?? 0);
    purposeBreakdown.set(p, cur);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-6 py-10">
      <PageHeader
        eyebrow="Admin"
        title="AI usage"
        description="Token spend and call volume across every engine run in the last 30 days."
      />

      <section className="grid gap-3 sm:grid-cols-4">
        <KpiCard label="Total cost (30d)" value={`$${totalCost.toFixed(2)}`} />
        <KpiCard label="Tokens" value={totalTokens.toLocaleString()} />
        <KpiCard label="Successful calls" value={successCount.toString()} />
        <KpiCard label="Failed calls" value={errorCount.toString()} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-base">By model</CardTitle>
            <CardDescription>Where token spend goes.</CardDescription>
          </CardHeader>
          <CardContent>
            {modelBreakdown.size === 0 ? (
              <p className="text-sm text-muted-foreground">No usage yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {Array.from(modelBreakdown.entries())
                  .sort((a, b) => b[1].cost - a[1].cost)
                  .map(([model, m]) => (
                    <li key={model} className="flex items-center justify-between">
                      <span className="font-mono text-xs">{model}</span>
                      <span className="tabular-nums text-muted-foreground">
                        ${m.cost.toFixed(2)} · {m.tokens.toLocaleString()} tokens · {m.count} calls
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-base">By purpose</CardTitle>
            <CardDescription>Which engine step uses the most AI.</CardDescription>
          </CardHeader>
          <CardContent>
            {purposeBreakdown.size === 0 ? (
              <p className="text-sm text-muted-foreground">No usage yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {Array.from(purposeBreakdown.entries())
                  .sort((a, b) => b[1].cost - a[1].cost)
                  .map(([purpose, p]) => (
                    <li key={purpose} className="flex items-center justify-between">
                      <span className="font-mono text-xs">{purpose}</span>
                      <span className="tabular-nums text-muted-foreground">
                        ${p.cost.toFixed(2)} · {p.count} calls
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Recent calls
        </h3>
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card/60">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">When</th>
                <th className="px-3 py-2 font-medium">Model</th>
                <th className="px-3 py-2 font-medium">Purpose</th>
                <th className="px-3 py-2 text-right font-medium">Tokens</th>
                <th className="px-3 py-2 text-right font-medium">Cost</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.slice(0, 100).map((r) => (
                <tr key={r.id} className="border-t border-border/40">
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{r.model}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.purpose}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {Number(r.total_tokens ?? 0).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    ${Number(r.cost_usd ?? 0).toFixed(4)}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        r.status === "success"
                          ? "inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-300"
                          : "inline-flex rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] text-red-300"
                      }
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-white/[0.06]">
      <CardContent className="py-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}
