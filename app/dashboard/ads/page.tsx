import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

import { PlatformCard } from "@/components/ads/platform-card";
import { PushWinnerForm } from "@/components/ads/push-winner-form";
import { ZapierConnector } from "@/components/integrations/zapier-connector";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isAdsConfigured } from "@/lib/ads-env";
import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import {
  createAdAccountRepository,
  createAdCampaignRepository,
  type AdAccountRow,
  type AdCampaignRow,
} from "@/repositories/ad-account.repository";
import { createBusinessRepository } from "@/repositories/business.repository";
import { createEngineRepository, type AssetRow } from "@/repositories/engine.repository";
import { getActiveEngineRun } from "@/services/engine/orchestrator.service";
import {
  ZAPIER_SUBSCRIBABLE_EVENTS,
  listZapierRulesForBusiness,
} from "@/services/integrations/zapier.service";

export const dynamic = "force-dynamic";

const PLATFORMS: Array<{
  id: "meta" | "google" | "tiktok" | "microsoft";
  label: string;
  description: string;
  accent: string;
}> = [
  {
    id: "meta",
    label: "Meta",
    description: "Facebook + Instagram. Push winning ad creative and pull spend/clicks/leads back into the engine.",
    accent: "linear-gradient(135deg, #1877F2, #8A3FFC)",
  },
  {
    id: "google",
    label: "Google",
    description: "Search + Display + YouTube. Coming after Meta — same connector shape.",
    accent: "linear-gradient(135deg, #4285F4, #34A853)",
  },
  {
    id: "tiktok",
    label: "TikTok",
    description: "Short-form video ads. Connector reserved.",
    accent: "linear-gradient(135deg, #25F4EE, #FE2C55)",
  },
  {
    id: "microsoft",
    label: "Microsoft",
    description: "Bing search + LinkedIn audience network. Connector reserved.",
    accent: "linear-gradient(135deg, #5E5E5E, #00A4EF)",
  },
];

export default async function AdsPage() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();

  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);

  if (!business) {
    return (
      <div className="mx-auto max-w-6xl space-y-10">
        <PageHeader
          eyebrow="Ads Engine"
          title="Platforms & live campaigns"
          description="Connect ad accounts and push the engine's winning creative live."
        />
        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle>Finish onboarding first</CardTitle>
            <CardDescription>Connect your business profile so the engine can push ads on your behalf.</CardDescription>
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

  const accountsRepo = createAdAccountRepository(supabase);
  const campaignsRepo = createAdCampaignRepository(supabase);
  const engineRepo = createEngineRepository(supabase);

  const [accountsRes, campaignsRes, activeRunRes, zapierRulesRes] = await Promise.all([
    accountsRepo.listByBusiness(business.id),
    campaignsRepo.listByBusiness(business.id, 50),
    getActiveEngineRun(supabase, business.id),
    listZapierRulesForBusiness(supabase, business.id),
  ]);

  const accountsByPlatform = new Map<string, AdAccountRow>();
  for (const a of (accountsRes.data ?? []) as AdAccountRow[]) {
    accountsByPlatform.set(a.platform, a);
  }

  const campaigns: AdCampaignRow[] = (campaignsRes.data ?? []) as AdCampaignRow[];
  const activeRun = activeRunRes.success ? activeRunRes.data : null;

  // Find a winning ad asset on the active run, if scoring has happened
  let winningAd: AssetRow | null = null;
  if (activeRun) {
    const { data: assets } = await engineRepo.listAssetsForRun(activeRun.id);
    winningAd = ((assets ?? []) as AssetRow[]).find(
      (a) => a.kind === "ad" && a.is_winner,
    ) ?? null;
  }

  // Rollup
  const totalSpend = campaigns.reduce((acc, c) => acc + Number(c.spend_usd ?? 0), 0);
  const totalLeads = campaigns.reduce((acc, c) => acc + Number(c.leads ?? 0), 0);
  const totalClicks = campaigns.reduce((acc, c) => acc + Number(c.clicks ?? 0), 0);
  const cpl = totalLeads > 0 ? totalSpend / totalLeads : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <PageHeader
        eyebrow="Ads Engine"
        title="Platforms & live campaigns"
        description="Connect ad accounts and push the engine's winning ad creative live. Spend and lead metrics flow back automatically."
      />

      {/* Rollup */}
      <section className="grid gap-3 sm:grid-cols-4">
        <KpiCard label="Connected platforms" value={Array.from(accountsByPlatform.values()).filter((a) => a.status !== "disconnected").length.toString()} />
        <KpiCard label="Active campaigns" value={campaigns.filter((c) => c.status === "active" || c.status === "pending").length.toString()} />
        <KpiCard label="Total spend" value={`$${totalSpend.toFixed(2)}`} />
        <KpiCard label="Cost / lead" value={cpl > 0 ? `$${cpl.toFixed(2)}` : "—"} />
      </section>

      {/* Connection cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLATFORMS.map((p) => {
          const acct = accountsByPlatform.get(p.id);
          return (
            <PlatformCard
              key={p.id}
              platform={p.id}
              label={p.label}
              description={p.description}
              accent={p.accent}
              configured={isAdsConfigured(p.id)}
              status={acct?.status ?? "disconnected"}
            />
          );
        })}
      </section>

      {/* Zapier connector */}
      <section>
        <ZapierConnector
          events={ZAPIER_SUBSCRIBABLE_EVENTS.map((e) => ({
            type: e.type as string,
            label: e.label,
            description: e.description,
          }))}
          rules={(zapierRulesRes.success ? zapierRulesRes.data : []).map((r) => ({
            id: r.id,
            name: r.name,
            triggerEvent: r.trigger_event,
            url: r.zapierUrl,
            enabled: r.enabled,
          }))}
        />
      </section>

      {/* Push winning creative */}
      {winningAd && activeRun ? (
        <section>
          <Card className="border-white/[0.06]">
            <CardHeader>
              <CardTitle className="text-lg">Push the engine's winning ad to Meta</CardTitle>
              <CardDescription>
                The scoring step picked variant <span className="font-mono">{winningAd.variant_label}</span> as your winning ad. Push it live below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PushWinnerForm
                engineRunId={activeRun.id}
                winningAssetId={winningAd.id}
                defaultName={`Engine · ${business.name} · variant ${winningAd.variant_label}`}
              />
            </CardContent>
          </Card>
        </section>
      ) : null}

      {/* Recent campaigns */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Recent ad campaigns
        </h3>
        {campaigns.length === 0 ? (
          <Card className="border-dashed border-white/[0.08]">
            <CardContent className="py-8 text-sm text-muted-foreground">
              No campaigns yet. Run the Growth Engine to scoring, then push the winner here.
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card/60">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Platform</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 text-right font-medium">Spend</th>
                  <th className="px-3 py-2 text-right font-medium">Clicks</th>
                  <th className="px-3 py-2 text-right font-medium">Leads</th>
                  <th className="px-3 py-2 text-right font-medium">CPL</th>
                  <th className="px-3 py-2 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const cplValue = c.leads > 0 ? Number(c.spend_usd) / c.leads : 0;
                  return (
                    <tr key={c.id} className="border-t border-border/40">
                      <td className="px-3 py-2 font-medium">{c.name}</td>
                      <td className="px-3 py-2 text-muted-foreground capitalize">{c.platform}</td>
                      <td className="px-3 py-2">
                        <span className={statusPillClass(c.status)}>{c.status}</span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        ${Number(c.spend_usd ?? 0).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{c.clicks ?? 0}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{c.leads ?? 0}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {cplValue > 0 ? `$${cplValue.toFixed(2)}` : "—"}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="border-t border-border/40 bg-muted/20 px-3 py-2 text-right text-[11px] text-muted-foreground">
              {campaigns.length} campaign{campaigns.length === 1 ? "" : "s"} · {totalClicks} clicks total
            </div>
          </div>
        )}
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

function statusPillClass(status: string) {
  const base = "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ";
  switch (status) {
    case "active":
      return base + "bg-emerald-500/15 text-emerald-300";
    case "pending":
      return base + "bg-amber-500/15 text-amber-300";
    case "paused":
      return base + "bg-slate-500/15 text-slate-300";
    case "error":
      return base + "bg-red-500/15 text-red-300";
    case "archived":
      return base + "bg-muted text-muted-foreground";
    default:
      return base + "bg-muted text-muted-foreground";
  }
}
