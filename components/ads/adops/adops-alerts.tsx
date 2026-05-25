"use client";

import Link from "next/link";

import { useAdops } from "@/components/ads/adops/adops-provider";
import { cn } from "@/lib/utils";

const TONE: Record<string, string> = {
  amber: "border-amber-500/30 bg-amber-500/10 text-amber-100",
  rose: "border-rose-500/30 bg-rose-500/10 text-rose-100",
  cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-100",
  violet: "border-violet-500/30 bg-violet-500/10 text-violet-100",
};

export function AdopsAlerts() {
  const { payload } = useAdops();
  if (!payload.alerts.length) return null;

  return (
    <ul className="space-y-2">
      {payload.alerts.map((a) => (
        <li key={a.id}>
          <Link
            href={a.href}
            className={cn(
              "block rounded-xl border px-4 py-2.5 text-sm transition-opacity hover:opacity-90",
              TONE[a.tone],
            )}
          >
            {a.message}
          </Link>
        </li>
      ))}
    </ul>
  );
}
