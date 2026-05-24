"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SUGGESTED_PROMPTS = [
  "Why are conversions low?",
  "Generate ad copy",
  "Optimize my funnel",
  "What should I do next?",
];

export function AiCopilotFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open ? (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] md:bg-black/20"
          aria-hidden
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {open ? (
          <div className="w-[min(100vw-2rem,22rem)] rounded-2xl border border-white/10 bg-card/95 p-4 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">Ask Diazites AI</p>
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
              Suggested prompts — connect to Agent Manager for full chat.
            </p>
            <ul className="space-y-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <li key={prompt}>
                  <a
                    href={`/dashboard/agents?q=${encodeURIComponent(prompt)}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "h-auto w-full justify-start whitespace-normal rounded-xl py-2.5 text-left text-xs",
                    )}
                  >
                    {prompt}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <Button
          type="button"
          variant="gradient"
          size="lg"
          className="rounded-full px-5 shadow-[0_12px_40px_-8px_rgba(99,102,241,0.55)]"
          onClick={() => setOpen((v) => !v)}
        >
          <MessageCircle className="size-4" />
          Ask Diazites AI
        </Button>
      </div>
    </>
  );
}
