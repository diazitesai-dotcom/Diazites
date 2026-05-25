"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Shield, X } from "lucide-react";

import { ENGINE_AGENTS } from "@/lib/engine/growth-engine-os-catalog";
import type { EngineAgentKey, AutonomyMode } from "@/lib/engine/growth-engine-os-types";
import { Button } from "@/components/ui/button";

const AUTONOMY_LABEL: Record<AutonomyMode, string> = {
  recommend_only: "Recommend only",
  requires_approval: "Requires approval",
  auto_execute: "Auto within limits",
  full_autonomous: "Full autonomous",
};

export function AgentDetailDrawer({
  agentKey,
  onClose,
  onToggle,
  enabled,
  autonomyMode,
}: {
  agentKey: EngineAgentKey | null;
  onClose: () => void;
  onToggle: (key: EngineAgentKey) => void;
  enabled: boolean;
  autonomyMode: AutonomyMode;
}) {
  const agent = ENGINE_AGENTS.find((a) => a.key === agentKey);

  return (
    <>
      <AnimatePresence>
        {agent ? (
          <motion.div className="fixed inset-0 z-[58] bg-black/55" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {agent ? (
          <motion.aside
            className="fixed inset-y-0 right-0 z-[59] flex w-full max-w-md flex-col border-l border-white/10 bg-card/98"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
          >
            <header className="border-b border-white/10 px-5 py-4">
              <div className="flex justify-between">
                <p className="text-base font-semibold">{agent.label}</p>
                <Button type="button" variant="ghost" size="icon-sm" onClick={onClose}>
                  <X className="size-4" />
                </Button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{agent.purpose}</p>
            </header>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 text-sm">
              <Block title="Agent role">{agent.purpose}</Block>
              <Block title="Data access">{agent.tools.join(", ")} + run payloads</Block>
              <Block title="Actions allowed">Create, optimize, recommend — bounded by {AUTONOMY_LABEL[autonomyMode]}</Block>
              <Block title="Current tasks">{enabled ? "Standing by for active run" : "Disabled for this deployment"}</Block>
              <Block title="Approval rules">
                <span className="flex items-center gap-1 text-xs">
                  <Shield className="size-3 text-violet-300" />
                  Spend and publish require policy checkpoint
                </span>
              </Block>
              <Block title="Logs">
                <ul className="font-mono text-[10px] text-muted-foreground">
                  <li>09:02 — Agent registered</li>
                  <li>09:04 — Permissions scoped</li>
                </ul>
              </Block>
            </div>
            <footer className="border-t border-white/10 p-4">
              <Button
                type="button"
                variant={enabled ? "outline" : "gradient"}
                className="w-full rounded-xl"
                onClick={() => onToggle(agent.key)}
              >
                {enabled ? "Disable agent" : "Enable agent"}
              </Button>
            </footer>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className="mt-1 text-muted-foreground">{children}</div>
    </section>
  );
}
