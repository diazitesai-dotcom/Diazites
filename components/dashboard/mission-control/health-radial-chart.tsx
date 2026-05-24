"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

type HealthRadialChartProps = {
  score: number;
  className?: string;
};

export function HealthRadialChart({ score, className }: HealthRadialChartProps) {
  const clamped = Math.min(100, Math.max(0, score));
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const scoreColor =
    clamped >= 80 ? "text-emerald-400" : clamped >= 50 ? "text-amber-400" : "text-rose-400";

  return (
    <div className={cn("relative flex size-36 shrink-0 items-center justify-center", className)}>
      <motion.div
        className="absolute inset-0 rounded-full bg-violet-500/20 blur-2xl"
        animate={{ opacity: [0.25, 0.45, 0.25], scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <svg className="size-full -rotate-90" viewBox="0 0 120 120" aria-hidden>
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-white/[0.06]"
        />
        <motion.circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="url(#healthGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
        <defs>
          <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.p
          className={cn("text-3xl font-bold tabular-nums", scoreColor)}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {clamped}
        </motion.p>
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          / 100
        </p>
      </div>
    </div>
  );
}
