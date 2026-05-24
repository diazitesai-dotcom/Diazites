"use client";

import { useState } from "react";
import { History } from "lucide-react";

import { cn } from "@/lib/utils";

const REPLAY_EVENTS = [
  { time: "09:02", label: "Traffic spike detected" },
  { time: "09:04", label: "Meta campaign deployed" },
  { time: "09:06", label: "Pixel validation failed" },
  { time: "09:07", label: "Lead captured" },
  { time: "09:09", label: "Follow-up sent" },
  { time: "09:13", label: "Optimization applied" },
];

export function SystemReplayBar({ className }: { className?: string }) {
  const [position, setPosition] = useState(80);

  return (
    <div
      className={cn(
        "rounded-xl border border-white/[0.08] bg-gradient-to-r from-card/90 to-violet-950/20 p-3",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <History className="size-4 text-cyan-300" />
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-200/90">
            System replay
          </span>
          <span className="text-[10px] text-muted-foreground">Last 24h</span>
        </div>
        <span className="text-[10px] tabular-nums text-muted-foreground">{REPLAY_EVENTS[position]?.time}</span>
      </div>
      <input
        type="range"
        min={0}
        max={REPLAY_EVENTS.length - 1}
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        className="mt-2 w-full accent-violet-500"
        aria-label="Scrub system replay timeline"
      />
      <p className="mt-1 text-[11px] text-muted-foreground">{REPLAY_EVENTS[position]?.label}</p>
    </div>
  );
}
