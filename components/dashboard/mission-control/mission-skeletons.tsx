"use client";

import { cn } from "@/lib/utils";

export function Shimmer({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-white/[0.06]", className)} />;
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-card/60 p-6">
      <Shimmer className="mb-3 h-3 w-24" />
      <Shimmer className="mb-4 h-8 w-20" />
      <Shimmer className="h-3 w-32" />
    </div>
  );
}

export function GlassCardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-card/60 p-6">
      <Shimmer className="mb-2 h-4 w-40" />
      <Shimmer className="mb-6 h-3 w-56" />
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Shimmer key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
