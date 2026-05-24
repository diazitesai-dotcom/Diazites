"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ChevronRight,
  Radar,
  Rocket,
  Sparkles,
  Terminal,
  TrendingDown,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { useAgentDeployment } from "@/components/agents/agent-deployment-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CopilotCommand =
  | {
      id: string;
      label: string;
      description: string;
      icon: typeof Terminal;
      kind: "deploy";
      launch: Parameters<ReturnType<typeof useAgentDeployment>["openDeployment"]>[0];
    }
  | {
      id: string;
      label: string;
      description: string;
      icon: typeof Terminal;
      kind: "brief";
      brief: { title: string; body: string; href?: string; hrefLabel?: string };
    };

const OPERATOR_COMMANDS: CopilotCommand[] = [
  {
    id: "review-plan",
    label: "Review growth plan",
    description: "Outcome, stack, guardrails, and approval",
    icon: Sparkles,
    kind: "deploy",
    launch: {
      stack: "lead_engine",
      goal: "generate_leads",
      step: "plan",
      source: "control_plane",
    },
  },
  {
    id: "deploy-lead-stack",
    label: "Deploy lead engine",
    description: "Landing → qualification → follow-up → CRM",
    icon: Rocket,
    kind: "deploy",
    launch: {
      stack: "lead_engine",
      goal: "generate_leads",
      step: "stack",
      source: "control_plane",
    },
  },
  {
    id: "explain-tracking",
    label: "Explain tracking failure",
    description: "Pixel, analytics, and conversion signal gaps",
    icon: Radar,
    kind: "brief",
    brief: {
      title: "Tracking failure analysis",
      body: "Meta pixel and GA4 events are the most common gaps before deploy. Verify domain verification, purchase/lead events, and CRM webhook handoff.",
      href: "/dashboard/integrations",
      hrefLabel: "Open integrations",
    },
  },
  {
    id: "diagnose-qualification",
    label: "Diagnose low qualification",
    description: "Queue depth, scoring rules, and follow-up SLA",
    icon: TrendingDown,
    kind: "brief",
    brief: {
      title: "Qualification diagnostic",
      body: "Check lead queue depth on the live system map, activation status of the Lead Qualification Agent, and same-day follow-up coverage on high-intent leads.",
      href: "/dashboard/agents",
      hrefLabel: "Open agents",
    },
  },
  {
    id: "explain-drop",
    label: "Explain performance drop",
    description: "Funnel, velocity, and inbound signals",
    icon: TrendingDown,
    kind: "brief",
    brief: {
      title: "Performance analysis",
      body: "Check inbound velocity for weekend spikes, qualification drop-off, and follow-up SLA breaches. Mission Control briefing surfaces the primary driver.",
      href: "/dashboard",
      hrefLabel: "Open Mission Control",
    },
  },
  {
    id: "optimize-cpl",
    label: "Optimize CPL",
    description: "Budget shift and creative fatigue recommendations",
    icon: Activity,
    kind: "deploy",
    launch: {
      goal: "improve_conversion",
      step: "plan",
      source: "control_plane",
    },
  },
];

export function AiCopilotFab() {
  const [open, setOpen] = useState(false);
  const [activeBrief, setActiveBrief] = useState<CopilotCommand & { kind: "brief" } | null>(null);
  const { openDeployment } = useAgentDeployment();
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function runCommand(command: CopilotCommand) {
    if (command.kind === "deploy") {
      setActiveBrief(null);
      setOpen(false);
      openDeployment(command.launch);
      return;
    }
    setActiveBrief(command);
  }

  return (
    <>
      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[55] bg-black/35 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            aria-hidden
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="dialog"
            aria-label="Diazites AI control plane"
            className="fixed bottom-24 right-6 z-[60] flex w-[min(420px,calc(100vw-3rem))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-card/98 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.85)] backdrop-blur-xl"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", damping: 26, stiffness: 340 }}
          >
            <div className="border-b border-white/10 bg-gradient-to-r from-violet-950/40 to-cyan-950/20 px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded-lg border border-violet-500/35 bg-violet-500/15">
                    <Terminal className="size-4 text-violet-200" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Ask Diazites AI</p>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-cyan-200/70">
                      Operator console
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-lg"
                  onClick={() => setOpen(false)}
                  aria-label="Close control plane"
                >
                  <X className="size-4" />
                </Button>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                Orchestration commands — not support chat. Run plans, deploy stacks, diagnose systems.
              </p>
            </div>

            <div className="max-h-[min(420px,60vh)] overflow-y-auto p-3">
              {activeBrief ? (
                <div className="space-y-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-cyan-200/90">
                    <Zap className="size-3.5" />
                    {activeBrief.brief.title}
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/90">{activeBrief.brief.body}</p>
                  <div className="flex gap-2">
                    {activeBrief.brief.href ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-lg border-white/10 text-xs"
                        onClick={() => {
                          setOpen(false);
                          router.push(activeBrief.brief.href!);
                        }}
                      >
                        {activeBrief.brief.hrefLabel ?? "Open"}
                        <ChevronRight className="ml-1 size-3.5" />
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-lg text-xs"
                      onClick={() => setActiveBrief(null)}
                    >
                      Back to commands
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Commands
                  </p>
                  <ul className="space-y-1.5">
                    {OPERATOR_COMMANDS.map((command, i) => (
                      <motion.li
                        key={command.id}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.04 * i }}
                      >
                        <button
                          type="button"
                          onClick={() => runCommand(command)}
                          className="group flex w-full items-start gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 text-left transition-all hover:border-violet-500/35 hover:bg-violet-500/10"
                        >
                          <command.icon className="mt-0.5 size-3.5 shrink-0 text-violet-300" />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium text-foreground group-hover:text-violet-100">
                              {command.label}
                            </span>
                            <span className="mt-0.5 block text-[11px] text-muted-foreground">
                              {command.description}
                            </span>
                          </span>
                          <ChevronRight className="mt-1 size-3.5 shrink-0 text-muted-foreground/50 group-hover:text-violet-300" />
                        </button>
                      </motion.li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <div className="border-t border-white/10 px-3 py-2">
              <p className="text-center text-[10px] text-muted-foreground/80">
                Control plane · Mission Control · Execution · System · Approvals
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="fixed bottom-6 right-6 z-[65]">
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            type="button"
            variant="gradient"
            size="lg"
            className={cn(
              "mission-shimmer-btn relative rounded-full px-5 shadow-[0_12px_40px_-8px_rgba(99,102,241,0.55)]",
              open && "ring-2 ring-cyan-400/40",
            )}
            onClick={() => {
              setActiveBrief(null);
              setOpen((v) => !v);
            }}
            aria-expanded={open}
          >
            {!open ? (
              <span
                className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-violet-500/20"
                aria-hidden
              />
            ) : null}
            <Terminal className="relative size-4" />
            <span className="relative">Ask Diazites AI</span>
          </Button>
        </motion.div>
      </div>
    </>
  );
}

/** Alias for architecture docs / imports */
export const AiControlPlane = AiCopilotFab;
