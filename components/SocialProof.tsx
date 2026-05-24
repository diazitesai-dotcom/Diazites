"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { SectionTitle } from "@/components/SectionTitle";

const stats = [
  { label: "Always-on AI coverage", value: 24, suffix: "/7", prefix: "" },
  { label: "Faster response time", value: 3, suffix: "x", prefix: "" },
  { label: "Hours saved monthly", value: 40, suffix: "+", prefix: "" },
  { label: "More leads converted", value: 2, suffix: "x", prefix: "~" },
];

function useCountUp(target: number, enabled: boolean, duration = 2000) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let start: number | null = null;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - (1 - p) ** 3;
      setV(Math.round(eased * target));
      if (p < 1) requestAnimationFrame(step);
    };
    const id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [enabled, target, duration]);
  return v;
}

function StatBlock({
  label,
  value,
  suffix,
  prefix,
  delay,
}: {
  label: string;
  value: number;
  suffix: string;
  prefix: string;
  delay: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!inView) return;
    const t = window.setTimeout(() => setStarted(true), delay);
    return () => window.clearTimeout(t);
  }, [inView, delay]);

  const display = useCountUp(value, started);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-8 text-center backdrop-blur-xl"
    >
      <p className="font-mono text-4xl font-bold tabular-nums text-white md:text-5xl">
        {prefix}
        {display}
        {suffix}
      </p>
      <p className="mt-3 text-sm font-medium uppercase tracking-wider text-white/45">
        {label}
      </p>
    </motion.div>
  );
}

export function SocialProof() {
  return (
    <section id="proof" className="scroll-mt-28 px-5 py-28 sm:px-8">
      <SectionTitle
        eyebrow="Proof"
        title="Metrics that feel different when AI never clocks out"
      />

      <div className="mx-auto mt-16 grid max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <StatBlock key={s.label} {...s} delay={i * 120} />
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mx-auto mt-14 max-w-2xl text-center text-sm text-white/45"
      >
        Illustrative benchmarks based on typical SMB deployments—your mileage varies by
        volume and integrations.
      </motion.p>
    </section>
  );
}
