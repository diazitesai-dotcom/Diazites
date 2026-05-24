"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Bell, Info, Lightbulb, Sparkles } from "lucide-react";

import type { CommandCenterItem, CommandCenterKind } from "@/lib/dashboard/mission-control-types";
import { cn } from "@/lib/utils";

const kindMeta: Record<
  CommandCenterKind,
  { label: string; icon: typeof AlertTriangle; className: string }
> = {
  alert: {
    label: "Alert",
    icon: AlertTriangle,
    className: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  },
  warning: {
    label: "Warning",
    icon: AlertTriangle,
    className: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  },
  recommendation: {
    label: "Recommendation",
    icon: Lightbulb,
    className: "border-violet-500/30 bg-violet-500/10 text-violet-200",
  },
};

export function CommandCenterBell({ items }: { items: CommandCenterItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const count = items.length;

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const alerts = items.filter((i) => i.kind === "alert");
  const warnings = items.filter((i) => i.kind === "warning");
  const recs = items.filter((i) => i.kind === "recommendation");

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Command center"
        className={cn(
          "relative flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-foreground transition-all",
          "hover:border-violet-500/40 hover:bg-violet-500/10 hover:shadow-[0_0_24px_-8px_rgba(139,92,246,0.45)]",
          open && "border-violet-500/40 bg-violet-500/10",
        )}
        onClick={() => setOpen((o) => !o)}
      >
        <Bell className="size-4" aria-hidden />
        {count > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] animate-pulse items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 px-1 text-[10px] font-semibold text-white">
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,380px)] overflow-hidden rounded-2xl border border-white/10 bg-card/95 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.85)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-violet-400" />
              <p className="text-sm font-semibold">Command Center</p>
            </div>
            <div className="flex gap-1.5 text-[10px] font-medium uppercase tracking-wide">
              {alerts.length > 0 ? (
                <span className="rounded-full border border-rose-500/30 px-1.5 py-0.5 text-rose-300">
                  {alerts.length} alert{alerts.length === 1 ? "" : "s"}
                </span>
              ) : null}
              {warnings.length > 0 ? (
                <span className="rounded-full border border-amber-500/30 px-1.5 py-0.5 text-amber-300">
                  {warnings.length} warn
                </span>
              ) : null}
            </div>
          </div>

          <ul className="max-h-[420px] overflow-y-auto divide-y divide-border/40">
            {items.length === 0 ? (
              <li className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <Info className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">All systems nominal — no open items.</p>
              </li>
            ) : (
              [...alerts, ...warnings, ...recs].map((item) => {
                const meta = kindMeta[item.kind];
                const Icon = meta.icon;
                const row = (
                  <div className="flex gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]">
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-lg border",
                        meta.className,
                      )}
                    >
                      <Icon className="size-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {meta.label}
                      </p>
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                  </div>
                );
                return (
                  <li key={item.id}>
                    {item.href ? <Link href={item.href}>{row}</Link> : row}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
