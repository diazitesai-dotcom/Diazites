"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Beaker } from "lucide-react";

import { Button } from "@/components/ui/button";
import { seedTestLaunchRunAction } from "@/services/engine/actions";

/**
 * Dev-only convenience: skips Stages 1-7 with hand-crafted payloads + a
 * QA-passing landing page winner. After clicking this, one more "Launch run"
 * click in the active-run section exercises the real Launch System.
 */
export function SeedTestLaunchButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await seedTestLaunchRunAction();
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        disabled={pending}
        className="rounded-xl"
      >
        <Beaker className="size-4" />
        {pending ? "Seeding…" : "Seed test launch run (dev)"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Creates a run at Stage 7 with a QA-passing landing page winner so you can
        click <span className="text-foreground">Launch run</span> next and see
        the real Launch System fire (no OpenAI tokens used).
      </p>
      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
