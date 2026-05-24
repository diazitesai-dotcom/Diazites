"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Cpu, Radar, ShieldCheck } from "lucide-react";

const pillars = [
  {
    title: "Operations & customer experience",
    body:
      "Self-sufficient AI workflows that answer inquiries, route urgency, and keep every conversation moving—so nothing slips through when your team is heads-down.",
    icon: Cpu,
  },
  {
    title: "Growth & presence",
    body:
      "Unified automation across ads, social, and follow-up—prioritizing clarity and measurable outcomes over noisy dashboards.",
    icon: Radar,
  },
  {
    title: "Standards you can trust",
    body:
      "Guardrails, approvals, and audit-friendly logs in a fast-moving field—so automation feels dependable, not chaotic.",
    icon: ShieldCheck,
  },
];

export function WhatWeDo() {
  return (
    <section
      id="what-we-do"
      className="relative scroll-mt-28 border-t border-white/[0.06] px-5 py-24 sm:px-8 md:py-32"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(59,130,246,0.06),transparent)]" />

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="font-display text-[11px] font-medium uppercase tracking-[0.38em] text-sky-200/70">
            What we do
          </p>
          <h2 className="font-display mt-6 text-balance text-4xl font-light leading-[1.15] tracking-tight text-white md:text-5xl lg:text-[3.25rem]">
            Turning autonomous intelligence into outcomes for businesses on Earth.
          </h2>
          <p className="mt-8 text-lg leading-relaxed text-white/55 md:text-xl">
            At Diazites AI, we bridge the gap between ambition and execution—deploying
            digital workers that sustain growth, strengthen resilience, and address the
            operational realities facing teams who can&apos;t afford to miss a single
            touchpoint.
          </p>
          <motion.a
            href="#how-it-works"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-10 inline-flex items-center gap-2 text-sm font-medium uppercase tracking-[0.22em] text-sky-300/90 transition hover:text-white"
          >
            Learn how it works
            <ArrowUpRight className="size-4" aria-hidden />
          </motion.a>
        </motion.div>

        <div className="mt-20 grid gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.06] md:grid-cols-3">
          {pillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.article
                key={p.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="group relative bg-[#080d18]/90 p-8 md:p-10"
              >
                <div className="mb-8 inline-flex size-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-sky-200/90 transition group-hover:border-sky-400/30 group-hover:text-white">
                  <Icon className="size-5" strokeWidth={1.25} aria-hidden />
                </div>
                <h3 className="font-display text-xl font-medium tracking-tight text-white md:text-2xl">
                  {p.title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-white/50 md:text-base">
                  {p.body}
                </p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
