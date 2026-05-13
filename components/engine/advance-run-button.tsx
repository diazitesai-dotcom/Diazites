"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRight, Rocket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { advanceEngineRunAction } from "@/services/engine/actions";

type AdvanceRunButtonProps = {
  runId: string;
  isFinal: boolean;
};

export function AdvanceRunButton({ runId, isFinal }: AdvanceRunButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
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
    <form action={handleSubmit} className="flex flex-col items-start gap-2">
      <input type="hidden" name="run_id" value={runId} />
      <Button type="submit" variant="gradient" disabled={pending}>
        {isFinal ? (
          <>
            <Rocket className="size-4" />
            {pending ? "Launching…" : "Launch run"}
          </>
        ) : (
          <>
            {pending ? "Advancing…" : "Advance to next stage"}
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>
      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </form>
  );
}
