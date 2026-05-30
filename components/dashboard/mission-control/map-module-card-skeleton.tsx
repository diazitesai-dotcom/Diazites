"use client";

import { cn } from "@/lib/utils";

export function MapModuleCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-10 flex flex-col justify-center gap-2 rounded-xl bg-card/90 px-4 py-3 backdrop-blur-sm",
        className,
      )}
      aria-hidden
    >
      <div className="h-3 w-28 animate-pulse rounded bg-white/10" />
      <div className="h-4 w-20 animate-pulse rounded bg-white/10" />
      <div className="h-2.5 w-16 animate-pulse rounded bg-white/[0.06]" />
    </div>
  );
}
