"use client";

import { AnimatePresence, motion } from "framer-motion";
import { KeyRound, Link2, RotateCcw, ScrollText, Unplug, Wrench, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { AGENT_CAPABILITY_GROUPS } from "@/lib/integrations/growth-integrations-catalog";
import type { GrowthIntegration } from "@/lib/integrations/integration-types";
import { cn } from "@/lib/utils";

type Tab = "overview" | "metrics" | "logs" | "permissions" | "actions" | "errors";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "metrics", label: "Metrics" },
  { id: "logs", label: "Logs" },
  { id: "permissions", label: "Permissions" },
  { id: "actions", label: "Agent actions" },
  { id: "errors", label: "Errors" },
];

export function IntegrationDetailDrawer({
  integration,
  onClose,
}: {
  integration: GrowthIntegration | null;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const caps = AGENT_CAPABILITY_GROUPS.find((g) => g.agentType === integration?.agentType);

  return (
    <>
      <AnimatePresence>
        {integration ? (
          <motion.div
            className="fixed inset-0 z-[58] bg-black/55 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {integration ? (
          <motion.aside
            role="dialog"
            className="fixed inset-y-0 right-0 z-[59] flex w-full max-w-lg flex-col border-l border-white/10 bg-card/98 backdrop-blur-xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
          >
            <header className="border-b border-white/10 px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold">{integration.name}</p>
                  <p className="text-xs capitalize text-muted-foreground">{integration.status.replace(/_/g, " ")}</p>
                </div>
                <Button type="button" variant="ghost" size="icon-sm" onClick={onClose}>
                  <X className="size-4" />
                </Button>
              </div>
              <nav className="mt-3 flex gap-1 overflow-x-auto">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={cn(
                      "shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
                      tab === t.id ? "bg-violet-500/20 text-violet-200" : "text-muted-foreground",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </nav>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-4 text-sm">
              {tab === "overview" ? (
                <div className="space-y-3">
                  <p className="text-muted-foreground">{integration.dataAccess}</p>
                  <p>Last sync: {integration.lastSync ?? "Never"}</p>
                  {integration.subchannels?.length ? (
                    <p className="text-xs text-muted-foreground">{integration.subchannels.join(" · ")}</p>
                  ) : null}
                  {integration.status !== "connected" ? (
                    <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-3 text-xs">
                      AI recommendation: Connect via OAuth or paste API key in secure vault (masked).
                    </div>
                  ) : null}
                </div>
              ) : null}
              {tab === "metrics" ? (
                <dl className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg border border-white/[0.06] p-2">
                    <dt className="text-muted-foreground">Campaigns</dt>
                    <dd className="font-semibold">{integration.connectedCampaigns ?? 0}</dd>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] p-2">
                    <dt className="text-muted-foreground">Agent permission</dt>
                    <dd className="font-semibold capitalize">{integration.agentPermissions.replace(/_/g, " ")}</dd>
                  </div>
                </dl>
              ) : null}
              {tab === "logs" ? (
                <ul className="space-y-1 font-mono text-[10px] text-muted-foreground">
                  <li>09:14 — Token validated (masked)</li>
                  <li>09:02 — Sync completed</li>
                  <li>08:55 — Agent read campaign metrics</li>
                </ul>
              ) : null}
              {tab === "permissions" ? (
                <ul className="space-y-1 text-xs">
                  {caps?.capabilities.map((c) => (
                    <li key={c}>✓ {c}</li>
                  ))}
                </ul>
              ) : null}
              {tab === "actions" ? (
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>Last agent action: Budget check · 18m ago</li>
                  <li>Pending approval: None</li>
                </ul>
              ) : null}
              {tab === "errors" ? (
                <p className="text-xs text-muted-foreground">
                  {integration.status === "error" || integration.status === "expired"
                    ? "Reconnect required — token invalid or expired."
                    : "No errors in last 24h."}
                </p>
              ) : null}
            </div>
            <footer className="flex flex-wrap gap-2 border-t border-white/10 p-4">
              <Button type="button" variant="gradient" size="sm" className="rounded-lg">
                <Link2 className="mr-1 size-3.5" />
                Connect
              </Button>
              <Button type="button" variant="outline" size="sm" className="rounded-lg border-white/10">
                <KeyRound className="mr-1 size-3.5" />
                API key
              </Button>
              <Button type="button" variant="outline" size="sm" className="rounded-lg border-white/10">
                <Wrench className="mr-1 size-3.5" />
                Manage
              </Button>
              <Button type="button" variant="outline" size="sm" className="rounded-lg border-white/10">
                <ScrollText className="mr-1 size-3.5" />
                View logs
              </Button>
              {integration.status === "connected" ? (
                <Button type="button" variant="ghost" size="sm" className="rounded-lg text-rose-300">
                  <Unplug className="mr-1 size-3.5" />
                  Disconnect
                </Button>
              ) : null}
              <Button type="button" variant="ghost" size="sm" className="rounded-lg">
                <RotateCcw className="mr-1 size-3.5" />
                Rollback
              </Button>
            </footer>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </>
  );
}
