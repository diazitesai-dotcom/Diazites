"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, Rocket, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { useAgentDeployment } from "@/components/agents/agent-deployment-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CopilotAction =
  | {
      label: string;
      description: string;
      kind: "deploy";
      launch: Parameters<ReturnType<typeof useAgentDeployment>["openDeployment"]>[0];
    }
  | { label: string; description: string; kind: "link"; href: string };

const COPILOT_ACTIONS: CopilotAction[] = [
  {
    label: "Deploy lead stack",
    description: "Landing → qualification → follow-up → CRM",
    kind: "deploy",
    launch: { stack: "lead_engine", goal: "generate_leads", source: "quick_action" },
  },
  {
    label: "Launch paid ads stack",
    description: "Meta, search, retargeting, analytics",
    kind: "deploy",
    launch: { stack: "paid_ads", goal: "launch_ads", source: "quick_action" },
  },
  {
    label: "Deploy retargeting agent",
    description: "High-intent visitor recovery",
    kind: "deploy",
    launch: {
      preset: "retargeting",
      agent: "retargeting",
      goal: "improve_conversion",
      mode: "autonomous",
      step: "readiness",
      source: "opportunity",
    },
  },
  {
    label: "Deploy full growth engine",
    description: "One-click full stack onboarding",
    kind: "deploy",
    launch: {
      goal: "deploy_full_growth_engine",
      stack: "growth_engine",
      mode: "guided",
      source: "growth_engine",
    },
  },
  {
    label: "Optimize CPL",
    description: "Open optimization workspace",
    kind: "link",
    href: "/dashboard/optimization",
  },
  {
    label: "Diagnose performance",
    description: "Mission control diagnostics view",
    kind: "link",
    href: "/dashboard",
  },
];

export function AiCopilotFab() {
  const [open, setOpen] = useState(false);
  const { openDeployment } = useAgentDeployment();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
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
          <motion.aside
            role="dialog"
            aria-label="Ask Diazites AI"
            className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-md flex-col border-l border-white/10 bg-card/98 shadow-[-24px_0_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/15 shadow-[0_0_20px_-6px_rgba(139,92,246,0.5)]">
                  <Sparkles className="size-4 text-violet-300" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Ask Diazites AI</p>
                  <p className="text-[11px] text-muted-foreground">Control plane</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-lg"
                onClick={() => setOpen(false)}
                aria-label="Close assistant"
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Run orchestration commands — deploy stacks, launch campaigns, or open diagnostics.
              </p>
              <ul className="mt-5 space-y-2">
                {COPILOT_ACTIONS.map((action, i) => (
                  <motion.li
                    key={action.label}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        if (action.kind === "deploy") {
                          openDeployment(action.launch);
                        } else {
                          window.location.href = action.href;
                        }
                      }}
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "mission-shimmer-btn h-auto w-full justify-start rounded-xl border-white/10 bg-white/[0.03] py-3 text-left transition-all hover:border-violet-500/40 hover:bg-violet-500/10",
                      )}
                    >
                      <span className="flex w-full items-start gap-2">
                        <Rocket className="mt-0.5 size-3.5 shrink-0 text-violet-300" />
                        <span>
                          <span className="block text-sm font-medium">{action.label}</span>
                          <span className="mt-0.5 block text-[11px] text-muted-foreground">
                            {action.description}
                          </span>
                        </span>
                      </span>
                    </button>
                  </motion.li>
                ))}
              </ul>
            </div>

            <div className="border-t border-white/10 p-5">
              <Link
                href="/dashboard/agents"
                onClick={() => setOpen(false)}
                className={cn(
                  buttonVariants({ variant: "gradient" }),
                  "mission-shimmer-btn w-full rounded-xl",
                )}
              >
                Open full AI workspace
              </Link>
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <div className="fixed bottom-6 right-6 z-[80]">
        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
          <Button
            type="button"
            variant="gradient"
            size="lg"
            className={cn(
              "relative rounded-full px-5 shadow-[0_12px_40px_-8px_rgba(99,102,241,0.55)]",
              open && "ring-2 ring-cyan-400/40",
            )}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            {!open ? (
              <span
                className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-violet-500/25"
                aria-hidden
              />
            ) : null}
            <MessageCircle className="relative size-4" />
            <span className="relative">Ask Diazites AI</span>
          </Button>
        </motion.div>
      </div>
    </>
  );
}
