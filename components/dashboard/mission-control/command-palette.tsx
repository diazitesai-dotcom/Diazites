"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Command, Search } from "lucide-react";

import { useAgentDeployment } from "@/components/agents/agent-deployment-provider";
import { useSystemModuleOptional } from "@/components/dashboard/mission-control/system-module-provider";
import { cn } from "@/lib/utils";

type CommandItem = {
  id: string;
  label: string;
  hint?: string;
  run: () => void;
};

export function MissionCommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { openDeployment } = useAgentDeployment();
  const systemModule = useSystemModuleOptional();

  const commands: CommandItem[] = [
    { id: "crm", label: "Open CRM", hint: "Leads pipeline", run: () => router.push("/dashboard/leads") },
    { id: "agents", label: "Open Agent Manager", run: () => router.push("/dashboard/agents") },
    { id: "campaigns", label: "Open Campaign Ops", run: () => router.push("/dashboard/campaign-ops") },
    { id: "integrations", label: "Open Growth Integrations Hub", run: () => router.push("/dashboard/integrations") },
    { id: "funnel", label: "Open Funnel Builder", run: () => router.push("/dashboard/funnel") },
    {
      id: "retarget",
      label: "Launch retargeting",
      run: () =>
        openDeployment({
          preset: "retargeting",
          agent: "retargeting",
          goal: "improve_conversion",
          step: "plan",
          source: "control_plane",
        }),
    },
    {
      id: "plan",
      label: "Review growth plan",
      run: () => openDeployment({ goal: "generate_leads", step: "plan", source: "control_plane" }),
    },
    {
      id: "traffic",
      label: "Show traffic inspector",
      run: () => systemModule?.openModule("traffic"),
    },
    {
      id: "failed",
      label: "Show failed nodes",
      run: () => systemModule?.openModule("crm"),
    },
    {
      id: "optimize-logs",
      label: "Review optimization logs",
      run: () => systemModule?.openModule("optimize"),
    },
  ];

  const filtered = commands.filter((c) =>
    query.trim() ? c.label.toLowerCase().includes(query.toLowerCase()) : true,
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function run(item: CommandItem) {
    setOpen(false);
    setQuery("");
    item.run();
  }

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            role="dialog"
            aria-label="Command palette"
            className="fixed left-1/2 top-[18%] z-[81] w-[min(520px,92vw)] -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-card/98 shadow-2xl"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
          >
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <Command className="size-4 text-violet-300" />
              <span className="text-sm font-medium">Command palette</span>
              <kbd className="ml-auto rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                ESC
              </kbd>
            </div>
            <div className="relative border-b border-white/10 px-4 py-2">
              <Search className="absolute left-6 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search commands…"
                className="w-full bg-transparent py-2 pl-8 text-sm outline-none"
                autoFocus
              />
            </div>
            <ul className="max-h-64 overflow-y-auto p-2">
              {filtered.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => run(item)}
                    className="flex w-full flex-col rounded-lg px-3 py-2 text-left text-sm hover:bg-violet-500/15"
                  >
                    <span>{item.label}</span>
                    {item.hint ? <span className="text-xs text-muted-foreground">{item.hint}</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
