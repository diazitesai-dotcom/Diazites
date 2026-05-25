"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { useAdops } from "@/components/ads/adops/adops-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PlatformWorkspaceDrawer() {
  const { platformWorkspace, setSelectedPlatform } = useAdops();
  const ws = platformWorkspace;

  return (
    <>
      <AnimatePresence>
        {ws ? (
          <motion.div
            className="fixed inset-0 z-[58] bg-black/55 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPlatform(null)}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {ws ? (
          <motion.aside
            className="fixed inset-y-0 right-0 z-[59] flex w-full max-w-2xl flex-col border-l border-white/10 bg-card/98 backdrop-blur-xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
          >
            <header className="shrink-0 border-b border-white/10 px-5 py-4">
              <div className="flex justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">{ws.label} workspace</p>
                  <p className="text-xs text-muted-foreground">
                    {ws.connectionStatus} · Last sync {ws.lastSync ?? "never"} · OAuth {ws.oauthHealth}
                  </p>
                </div>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => setSelectedPlatform(null)}>
                  <X className="size-4" />
                </Button>
              </div>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-6 text-sm">
              <Section title="Overview">
                <MetricGrid
                  items={[
                    { label: "Spend", value: `$${ws.totalSpend.toFixed(2)}` },
                    { label: "Leads", value: String(ws.leads) },
                    { label: "ROAS", value: ws.roas != null ? `${ws.roas}×` : "—" },
                    { label: "Campaigns", value: String(ws.campaignCount) },
                    { label: "Accounts", value: String(ws.activeAccounts) },
                    { label: "Pixel", value: ws.pixelConnected ? "Connected" : "Missing" },
                  ]}
                />
              </Section>

              <Section title="Ad accounts">
                {ws.accounts.length ? (
                  <ul className="space-y-2">
                    {ws.accounts.map((a) => (
                      <li key={a.id} className="rounded-lg border border-white/[0.06] p-3">
                        <p className="font-medium">{a.accountName}</p>
                        <p className="text-xs text-muted-foreground">{a.businessName} · {a.accountId}</p>
                        <p className="mt-1 text-xs tabular-nums">
                          {a.status} · ${a.spendToday} today · {a.currency}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <Button type="button" size="sm" variant="outline" className="h-7 text-[10px] rounded-lg">
                            Switch
                          </Button>
                          <Button type="button" size="sm" variant="outline" className="h-7 text-[10px] rounded-lg">
                            Sync
                          </Button>
                          <Button type="button" size="sm" variant="ghost" className="h-7 text-[10px] rounded-lg">
                            Manage
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">Connect platform to load ad accounts.</p>
                )}
              </Section>

              <Section title="Campaigns">
                <CampaignMiniTable campaigns={ws.campaigns} />
              </Section>

              <Section title="Pixels / tracking">
                <p className="text-xs text-muted-foreground">
                  {ws.label} pixel · Event health {ws.pixelConnected ? "OK" : "Missing"}
                  {ws.eventLossPercent != null ? ` · Event loss ${ws.eventLossPercent}%` : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" className="rounded-lg border-white/10">
                    Validate pixel
                  </Button>
                  <Button type="button" size="sm" variant="outline" className="rounded-lg border-white/10">
                    Open events
                  </Button>
                  <Button type="button" size="sm" variant="outline" className="rounded-lg border-white/10">
                    Repair tracking
                  </Button>
                </div>
              </Section>

              <Section title="Audiences">
                <ul className="space-y-2">
                  {ws.audiences.map((a) => (
                    <li key={a.name} className="flex justify-between rounded-lg border border-white/[0.06] px-3 py-2 text-xs">
                      <span>{a.name}</span>
                      <span className="text-muted-foreground">{a.type} · {a.size}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex gap-2">
                  <Button type="button" size="sm" variant="outline" className="rounded-lg text-xs">
                    Create audience
                  </Button>
                  <Button type="button" size="sm" variant="outline" className="rounded-lg text-xs">
                    Deploy retargeting
                  </Button>
                </div>
              </Section>

              <Section title="Creative library">
                <ul className="space-y-2">
                  {ws.creatives.map((c) => (
                    <li key={c.name} className="rounded-lg border border-white/[0.06] px-3 py-2 text-xs">
                      <span className="font-medium">{c.name}</span>
                      <span className="text-muted-foreground"> · {c.type} · {c.performance}</span>
                    </li>
                  ))}
                </ul>
              </Section>

              <Section title="Agent activity feed">
                <ul className="space-y-2">
                  {ws.agentFeed.map((a) => (
                    <li key={a.id} className="rounded-lg border border-violet-500/15 bg-violet-500/5 p-3 text-xs">
                      <p>{a.message}</p>
                      <p className="mt-1 text-muted-foreground">
                        {a.timestamp} · {a.confidence}% conf · {a.riskScore} risk
                      </p>
                      <div className="mt-2 flex gap-2">
                        <Button type="button" size="sm" variant="ghost" className="h-7 text-[10px]">
                          Review
                        </Button>
                        {a.rollbackAvailable ? (
                          <Button type="button" size="sm" variant="ghost" className="h-7 text-[10px]">
                            Rollback
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </Section>
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

function MetricGrid({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map((i) => (
        <div key={i.label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
          <dt className="text-[10px] text-muted-foreground">{i.label}</dt>
          <dd className="font-semibold tabular-nums">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function CampaignMiniTable({ campaigns }: { campaigns: import("@/lib/ads/adops-types").LiveCampaignRow[] }) {
  const { setSelectedCampaign } = useAdops();
  if (!campaigns.length) return <p className="text-xs text-muted-foreground">No campaigns on this platform.</p>;
  return (
    <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
      <table className="w-full text-[11px]">
        <thead className="bg-muted/20 text-muted-foreground">
          <tr>
            <th className="px-2 py-1.5 text-left">Campaign</th>
            <th className="px-2 py-1.5">Status</th>
            <th className="px-2 py-1.5 text-right">Spend</th>
            <th className="px-2 py-1.5 text-right">CPL</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c) => (
            <tr
              key={c.id}
              className="cursor-pointer border-t border-white/[0.04] hover:bg-violet-500/10"
              onClick={() => setSelectedCampaign(c)}
            >
              <td className="px-2 py-1.5 font-medium">{c.name}</td>
              <td className="px-2 py-1.5 capitalize">{c.status.replace(/_/g, " ")}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">${c.spend.toFixed(0)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{c.cpl != null ? `$${c.cpl.toFixed(0)}` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
