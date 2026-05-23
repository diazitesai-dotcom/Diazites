"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { runFullEnginePipelineAction } from "@/services/engine/actions";

type RunFullEngineButtonProps = {
  runId: string;
  disabled?: boolean;
};

export function RunFullEngineButton({ runId, disabled }: RunFullEngineButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await runFullEnginePipelineAction(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col items-start gap-2">
      <input type="hidden" name="run_id" value={runId} />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        className="rounded-xl border-violet-500/40"
        disabled={disabled || pending}
      >
        <Sparkles className="size-4" aria-hidden />
        {pending ? "Running all 8 stages…" : "Run full engine (1-click)"}
      </Button>
      {error ? (
        <p className="max-w-sm rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </form>
  );
}
