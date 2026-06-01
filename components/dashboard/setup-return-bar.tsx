"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";

function SetupReturnBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const inSetupFlow = searchParams.get("setup") === "1";
  const onMissionControl = pathname === "/dashboard";

  if (!inSetupFlow || onMissionControl) return null;

  return (
    <div className="sticky top-0 z-40 border-b border-violet-500/25 bg-violet-950/40 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2">
        <div className="flex min-w-0 items-center gap-2 text-xs text-violet-100">
          <Sparkles className="size-3.5 shrink-0 text-violet-300" />
          <span className="truncate">
            Finish this step, then head back to your AI setup in Mission Control.
          </span>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-violet-400/40 bg-violet-500/15 px-3 py-1.5 text-xs font-medium text-violet-100 transition-colors hover:bg-violet-500/25"
        >
          <ArrowLeft className="size-3.5" />
          Back to setup
        </Link>
      </div>
    </div>
  );
}

export function SetupReturnBar() {
  return (
    <Suspense fallback={null}>
      <SetupReturnBarInner />
    </Suspense>
  );
}
