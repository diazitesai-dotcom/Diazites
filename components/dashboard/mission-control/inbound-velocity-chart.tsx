"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { SparkAnnotation, SparkPoint } from "@/lib/dashboard/mission-control-types";
import { cn } from "@/lib/utils";

function VelocityTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: SparkPoint }[];
}) {
  if (!active || !payload?.[0]) return null;
  const point = payload[0].payload;
  const ann = point.annotation;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[260px] rounded-xl border border-white/10 bg-card/95 px-3 py-2.5 text-xs shadow-xl backdrop-blur-md"
    >
      <p className="font-semibold text-foreground">
        {point.d}: <span className="tabular-nums text-violet-200">{point.v} leads</span>
      </p>
      {ann ? <AnnotationBody annotation={ann} compact /> : null}
    </motion.div>
  );
}

function AnnotationBody({
  annotation: ann,
  compact = false,
}: {
  annotation: SparkAnnotation;
  compact?: boolean;
}) {
  return (
    <motion.div
      className={cn(
        "rounded-lg border px-2.5 py-2",
        compact ? "mt-2" : "",
        ann.kind === "spike"
          ? "border-cyan-500/30 bg-cyan-500/10"
          : ann.kind === "warning"
            ? "border-amber-500/30 bg-amber-500/10"
            : "border-white/10 bg-white/[0.03]",
      )}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {ann.label ? (
        <p
          className={cn(
            "text-[10px] font-semibold uppercase tracking-wider",
            ann.kind === "spike" ? "text-cyan-300/90" : "text-amber-300/90",
          )}
        >
          {ann.label}
        </p>
      ) : null}
      <p
        className={cn(
          "font-semibold",
          ann.kind === "spike" ? "text-cyan-100" : "text-amber-100",
          ann.label && "mt-1",
        )}
      >
        {ann.title}
      </p>
      {ann.source ? (
        <p className="mt-1 text-muted-foreground">
          <span className="font-medium text-foreground/80">Source: </span>
          {ann.source}
        </p>
      ) : null}
      {ann.detail ? (
        <p className="mt-1.5 text-[11px] font-medium text-muted-foreground">{ann.detail}</p>
      ) : null}
      {ann.predictions?.map((line) => (
        <p key={line} className="mt-0.5 text-[11px] font-semibold tabular-nums text-amber-200/95">
          {line}
        </p>
      ))}
    </motion.div>
  );
}

function VelocityIntelligenceLayer({ annotations }: { annotations: SparkPoint[] }) {
  if (annotations.length === 0) return null;

  return (
    <div className="mt-4 space-y-2 border-t border-white/[0.06] pt-4">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-violet-300/90">
        <Sparkles className="size-3" />
        AI annotation layer
      </p>
      <motion.div
        className="grid gap-2 sm:grid-cols-2"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.08 } },
        }}
      >
        {annotations.map((point) => (
          <motion.div
            key={`${point.d}-${point.annotation?.title}`}
            variants={{
              hidden: { opacity: 0, y: 6 },
              show: { opacity: 1, y: 0 },
            }}
          >
            {point.annotation ? <AnnotationBody annotation={point.annotation} /> : null}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

export function InboundVelocityChart({ data }: { data?: SparkPoint[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const series = data && data.length > 0 ? data : [];
  const annotated = useMemo(
    () => series.filter((p) => p.annotation),
    [series],
  );

  if (!mounted) {
    return (
      <motion.div className="space-y-3">
        <div className="h-[140px] w-full animate-pulse rounded-xl bg-white/[0.04]" />
        <motion.div className="h-16 animate-pulse rounded-xl bg-white/[0.03]" />
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="relative h-[160px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="velocityFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="d"
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip content={<VelocityTooltip />} cursor={{ stroke: "rgba(139,92,246,0.3)" }} />
            <Area
              type="monotone"
              dataKey="v"
              stroke="#818cf8"
              strokeWidth={2}
              fill="url(#velocityFill)"
              dot={(props) => {
                const { cx, cy, payload } = props as {
                  cx: number;
                  cy: number;
                  payload: SparkPoint;
                };
                if (!payload.annotation) return null;
                const kind = payload.annotation.kind;
                return (
                  <g key={`${payload.d}-dot`}>
                    {kind === "spike" ? (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={8}
                        fill="rgba(34,211,238,0.15)"
                        className="mission-timeline-dot-pulse"
                      />
                    ) : null}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill={kind === "warning" ? "#fbbf24" : "#22d3ee"}
                      stroke="var(--card)"
                      strokeWidth={2}
                    />
                  </g>
                );
              }}
              activeDot={{ r: 6, fill: "#22d3ee", strokeWidth: 0 }}
              isAnimationActive
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <VelocityIntelligenceLayer annotations={annotated} />
    </motion.div>
  );
}
