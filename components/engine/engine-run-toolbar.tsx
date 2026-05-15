"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  archiveEngineRunAction,
  deleteEngineRunAction,
} from "@/services/engine/run-actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EngineRunToolbar({ runId }: { runId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      <Link href="/dashboard/engine" className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}>
        Back to runs
      </Link>
      <button
        type="button"
        disabled={pending}
        className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
        onClick={() => {
          if (!confirm("Archive this run?")) return;
          startTransition(async () => {
            await archiveEngineRunAction(runId);
            router.refresh();
          });
        }}
      >
        Archive
      </button>
      <button
        type="button"
        disabled={pending}
        className={cn(buttonVariants({ variant: "outline" }), "rounded-xl text-red-300")}
        onClick={() => {
          if (!confirm("Delete this run permanently?")) return;
          startTransition(async () => {
            await deleteEngineRunAction(runId);
          });
        }}
      >
        Delete
      </button>
    </div>
  );
}
