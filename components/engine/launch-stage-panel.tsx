"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Rocket, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { advanceEngineRunAction } from "@/services/engine/actions";

type LaunchStagePanelProps = {
  runId: string;
  hasWinner: boolean;
  qaFailed?: boolean;
};

/**
 * Stage 8 — single action publishes landing page, QA, pixels, and UTM.
 */
export function LaunchStagePanel({ runId, hasWinner, qaFailed }: LaunchStagePanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function launchNow(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await advanceEngineRunAction(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 rounded-2xl border border-violet-500/35 bg-gradient-to-br from-violet-500/10 via-transparent to-fuchsia-500/5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="flex items-center gap-2 text-sm font-semibold text-violet-100">
            <Rocket className="size-4" aria-hidden />
            Launch in 1 click
          </p>
          <p className="max-w-lg text-xs text-muted-foreground">
            Publishes your winning landing page, runs 7 QA checks, sets UTM links and conversion
            tracking, and goes live — no second confirmation step.
          </p>
        </div>
        <form action={launchNow}>
          <input type="hidden" name="run_id" value={runId} />
          <Button
            type="submit"
            variant="gradient"
            size="lg"
            className="rounded-xl px-6"
            disabled={pending || !hasWinner}
          >
            <Rocket className="size-4" aria-hidden />
            {pending ? "Launching…" : "Launch now"}
          </Button>
        </form>
      </div>

      {!hasWinner ? (
        <p className="text-xs text-amber-200/90">
          Complete <strong className="font-medium">Stage 7 (Scoring)</strong> first so a winning
          landing variant is selected — or use AI recreate below to regenerate landing pages.
        </p>
      ) : (
        <ul className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
          {[
            "Publish landing page to /p/slug",
            "7-point QA gate",
            "UTM campaign links",
            "Meta + Google pixel placeholders",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <ShieldCheck className="size-3.5 shrink-0 text-emerald-400/80" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      )}

      {qaFailed ? (
        <p className="text-xs text-amber-200">
          QA failed on the last attempt. Fix assets or recreate landing pages, then launch again.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
