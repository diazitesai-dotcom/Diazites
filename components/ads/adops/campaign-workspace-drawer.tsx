"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { useAdops } from "@/components/ads/adops/adops-provider";
import { Button } from "@/components/ui/button";
import {
  CAMPAIGN_WORKSPACE_TABS,
  type CampaignWorkspaceTab,
} from "@/lib/ads/adops-types";
import { cn } from "@/lib/utils";

export function CampaignWorkspaceDrawer() {
  const { selectedCampaign, setSelectedCampaign } = useAdops();
  const [tab, setTab] = useState<CampaignWorkspaceTab>("overview");
  const c = selectedCampaign;

  return (
    <>
      <AnimatePresence>
        {c ? (
          <motion.div
            className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedCampaign(null)}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {c ? (
          <motion.aside
            className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-2xl flex-col border-l border-white/10 bg-card/98 backdrop-blur-xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
          >
            <header className="shrink-0 border-b border-white/10 px-5 py-4">
              <div className="flex justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.platformLabel} · {c.objective} · {c.status.replace(/_/g, " ")}
                  </p>
                </div>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => setSelectedCampaign(null)}>
                  <X className="size-4" />
                </Button>
              </div>
              <div className="mt-3 flex gap-1 overflow-x-auto pb-1">
                {CAMPAIGN_WORKSPACE_TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={cn(
                      "shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
                      tab === t.id
                        ? "bg-violet-500/25 text-violet-100"
                        : "text-muted-foreground hover:bg-white/[0.04]",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-sm">
              {tab === "overview" && (
                <div className="space-y-4">
                  <MetricRow label="Budget" value={`$${c.budget}/day`} />
                  <MetricRow label="Spend" value={`$${c.spend.toFixed(2)}`} />
                  <MetricRow label="Leads" value={String(c.leads)} />
                  <MetricRow label="Last AI action" value={c.lastAiAction} />
                  <p className="text-xs text-muted-foreground">
                    Owner: Ads Agent · Launched via Growth Engine pipeline
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" className="rounded-lg">
                      Pause
                    </Button>
                    <Button type="button" size="sm" variant="outline" className="rounded-lg">
                      Optimize
                    </Button>
                    <Button type="button" size="sm" variant="outline" className="rounded-lg">
                      Duplicate
                    </Button>
                  </div>
                </div>
              )}
              {tab === "performance" && (
                <div className="space-y-4">
                  <SparkBars label="Spend" values={[40, 55, 48, 62, c.spend > 0 ? 70 : 30]} />
                  <SparkBars label="Leads" values={[2, 4, 3, 6, c.leads]} />
                  <dl className="grid grid-cols-2 gap-2">
                    <MiniStat label="CPL" value={c.cpl != null ? `$${c.cpl.toFixed(2)}` : "—"} />
                    <MiniStat label="CTR" value={`${c.ctr}%`} />
                    <MiniStat label="ROAS" value={c.roas != null ? `${c.roas}×` : "—"} />
                    <MiniStat label="Conv. rate" value={`${c.conversionRate}%`} />
                  </dl>
                </div>
              )}
              {tab === "creatives" && (
                <div className="space-y-3">
                  <CreativeRow name="Hero video · Variant A" perf="4.2% CTR" />
                  <CreativeRow name="Carousel · Variant B" perf="3.1% CTR" />
                  <div className="flex gap-2 pt-2">
                    <Button type="button" size="sm" variant="outline" className="rounded-lg text-xs">
                      Generate variant
                    </Button>
                    <Button type="button" size="sm" variant="outline" className="rounded-lg text-xs">
                      Launch A/B test
                    </Button>
                  </div>
                </div>
              )}
              {tab === "audiences" && (
                <ul className="space-y-2 text-xs">
                  <li className="rounded-lg border border-white/[0.06] p-3">Broad — interest stack</li>
                  <li className="rounded-lg border border-white/[0.06] p-3">Retargeting — 30d visitors</li>
                  <li className="rounded-lg border border-white/[0.06] p-3">Lookalike 1% converters</li>
                </ul>
              )}
              {tab === "tracking" && (
                <div className="space-y-3 text-xs text-muted-foreground">
                  <p>Pixel: {c.platformId === "meta" ? "Meta Pixel" : "Platform tag"} — health {c.aiHealth}</p>
                  <p>Purchase events: OK · Lead events: {c.aiHealth === "failed_tracking" ? "Degraded" : "OK"}</p>
                  <Button type="button" size="sm" variant="outline" className="rounded-lg">
                    Repair tracking
                  </Button>
                </div>
              )}
              {tab === "optimization" && (
                <ul className="space-y-2 text-xs">
                  <OptRow action="Budget +12% on Ad Set A" when="12m ago" />
                  <OptRow action="Paused low CTR creative" when="1h ago" />
                  <OptRow action="Audience narrowed to retargeting" when="3h ago" />
                </ul>
              )}
              {tab === "reasoning" && (
                <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 text-sm leading-relaxed">
                  <p className="font-medium text-violet-100">Why the AI acted</p>
                  <ul className="mt-3 list-disc space-y-2 pl-4 text-muted-foreground">
                    {c.cpl != null && c.cpl > 30 ? (
                      <li>CPL rose — audience fatigue detected on broad segment.</li>
                    ) : null}
                    <li>Budget shifted toward best performer after 48h learning window.</li>
                    <li>Retargeting segment outperformed prospecting by 22% on CPL.</li>
                  </ul>
                </div>
              )}
              {tab === "logs" && (
                <ul className="space-y-2 font-mono text-[11px] text-muted-foreground">
                  <li className="rounded border border-white/[0.06] px-2 py-1.5">09:14 · API 200 · budget update</li>
                  <li className="rounded border border-white/[0.06] px-2 py-1.5">09:02 · API 200 · creative pause</li>
                  <li className="rounded border border-white/[0.06] px-2 py-1.5">08:40 · Deploy checkpoint · approved</li>
                </ul>
              )}
              {tab === "approvals" && (
                <p className="text-xs text-muted-foreground">
                  {c.status === "requires_approval"
                    ? "Pending operator approval for budget increase over threshold."
                    : "No pending approvals for this campaign."}
                </p>
              )}
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-white/[0.06] py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] p-2.5">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function SparkBars({ label, values }: { label: string; values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div>
      <p className="mb-2 text-[10px] uppercase text-muted-foreground">{label}</p>
      <div className="flex h-12 items-end gap-1">
        {values.map((v, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-gradient-to-t from-violet-600/80 to-cyan-500/60"
            style={{ height: `${(v / max) * 100}%`, minHeight: 4 }}
          />
        ))}
      </div>
    </div>
  );
}

function CreativeRow({ name, perf }: { name: string; perf: string }) {
  return (
    <div className="flex justify-between rounded-lg border border-white/[0.06] px-3 py-2 text-xs">
      <span>{name}</span>
      <span className="text-muted-foreground">{perf}</span>
    </div>
  );
}

function OptRow({ action, when }: { action: string; when: string }) {
  return (
    <li className="flex justify-between rounded-lg border border-white/[0.06] px-3 py-2">
      <span>{action}</span>
      <span className="text-muted-foreground">{when}</span>
    </li>
  );
}
