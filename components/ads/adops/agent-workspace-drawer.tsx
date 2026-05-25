"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { useAdops } from "@/components/ads/adops/adops-provider";
import { Button } from "@/components/ui/button";
import type { AgentAutonomyMode } from "@/lib/ads/adops-types";
import { cn } from "@/lib/utils";

const MODES: { id: AgentAutonomyMode; label: string }[] = [
  { id: "read_only", label: "Read only" },
  { id: "recommend_only", label: "Recommend only" },
  { id: "requires_approval", label: "Requires approval" },
  { id: "auto_execute", label: "Auto under limits" },
  { id: "full_autonomous", label: "Full autonomous" },
];

export function AgentWorkspaceDrawer() {
  const { selectedAgent, setSelectedAgent } = useAdops();
  const [mode, setMode] = useState<AgentAutonomyMode>("requires_approval");
  const a = selectedAgent;

  return (
    <>
      <AnimatePresence>
        {a ? (
          <motion.div
            className="fixed inset-0 z-[62] bg-black/55 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedAgent(null)}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {a ? (
          <motion.aside
            className="fixed inset-y-0 right-0 z-[63] flex w-full max-w-xl flex-col border-l border-white/10 bg-card/98 backdrop-blur-xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
          >
            <header className="shrink-0 border-b border-white/10 px-5 py-4">
              <div className="flex justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">{a.label}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {a.status} · {a.stage} · Runtime {a.runtime}
                  </p>
                </div>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => setSelectedAgent(null)}>
                  <X className="size-4" />
                </Button>
              </div>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-6 text-sm">
              <section>
                <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Overview
                </h3>
                <p>{a.currentTask}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Confidence {a.confidence}% · Risk {a.risk} · Platforms:{" "}
                  {a.connectedPlatforms.join(", ") || "—"}
                </p>
              </section>

              <section>
                <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Current tasks
                </h3>
                {a.tasks.length ? (
                  <ul className="space-y-1.5">
                    {a.tasks.map((t) => (
                      <li key={t} className="rounded-lg border border-white/[0.06] px-3 py-2 text-xs">
                        {t}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">Queue empty</p>
                )}
              </section>

              <section>
                <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  AI reasoning
                </h3>
                <p className="rounded-xl border border-violet-500/15 bg-violet-500/5 p-3 text-xs leading-relaxed">
                  {a.reasoning}
                </p>
              </section>

              <section>
                <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions taken
                </h3>
                {a.actionsTimeline.length ? (
                  <ul className="space-y-2">
                    {a.actionsTimeline.map((row, i) => (
                      <li key={i} className="rounded-lg border border-white/[0.06] p-3 text-xs">
                        <p className="font-medium">{row.action}</p>
                        <p className="text-muted-foreground">
                          {row.time} · {row.result} · {row.risk} risk
                        </p>
                        {row.rollback ? (
                          <Button type="button" size="sm" variant="ghost" className="mt-2 h-7 text-[10px]">
                            Rollback
                          </Button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">No actions yet this session.</p>
                )}
              </section>

              <section>
                <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Permissions
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {MODES.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMode(m.id)}
                      className={cn(
                        "rounded-lg px-2.5 py-1 text-[10px] font-semibold",
                        mode === m.id
                          ? "bg-cyan-500/20 text-cyan-100"
                          : "border border-white/[0.08] text-muted-foreground",
                      )}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </>
  );
}
