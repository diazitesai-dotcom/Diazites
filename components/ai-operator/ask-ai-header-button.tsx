"use client";

import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { dispatchOperatorOpen } from "@/lib/ai-operator/operator-ui-events";

export function AskAiHeaderButton() {
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="rounded-xl border-violet-500/35 bg-violet-500/10 text-violet-100 hover:bg-violet-500/20 sm:hidden"
        onClick={() => dispatchOperatorOpen()}
        aria-label="Open Ask Diazites AI"
      >
        <Sparkles className="size-4 text-violet-300" aria-hidden />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="hidden gap-1.5 rounded-xl border-violet-500/35 bg-violet-500/10 text-violet-100 hover:bg-violet-500/20 sm:inline-flex"
        onClick={() => dispatchOperatorOpen()}
        aria-label="Open Ask Diazites AI"
      >
        <Sparkles className="size-3.5 text-violet-300" aria-hidden />
        Ask AI
      </Button>
    </>
  );
}
