"use client";

import { useState } from "react";
import { MessageCircle, Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SUGGESTED_PROMPTS = [
  "Why are leads low?",
  "Build my campaign",
  "Optimize funnel",
  "Analyze account",
];

export function AiCopilotFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] md:bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-hidden
            onClick={() => setOpen(false)}
          />
        ) : null}
      </AnimatePresence>

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        <AnimatePresence>
          {open ? (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-[min(100vw-2rem,22rem)] rounded-2xl border border-white/10 bg-card/95 p-4 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-violet-400" />
                  <p className="text-sm font-semibold">Ask Diazites AI</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-lg"
                  onClick={() => setOpen(false)}
                  aria-label="Close copilot"
                >
                  <X className="size-4" />
                </Button>
              </div>
              <p className="mb-3 text-xs text-muted-foreground">
                Suggested prompts — opens Agent Manager for full AI chat.
              </p>
              <ul className="space-y-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <li key={prompt}>
                    <a
                      href={`/dashboard/agents?q=${encodeURIComponent(prompt)}`}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "h-auto w-full justify-start whitespace-normal rounded-xl py-2.5 text-left text-xs transition-all hover:border-violet-500/30 hover:bg-violet-500/10",
                      )}
                    >
                      {prompt}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
          <Button
            type="button"
            variant="gradient"
            size="lg"
            className="relative rounded-full px-5 shadow-[0_12px_40px_-8px_rgba(99,102,241,0.55)]"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="absolute inset-0 animate-ping rounded-full bg-violet-500/20" aria-hidden />
            <MessageCircle className="relative size-4" />
            <span className="relative">Ask Diazites AI</span>
          </Button>
        </motion.div>
      </div>
    </>
  );
}
