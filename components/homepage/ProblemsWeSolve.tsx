"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";

import { problemPainPoints } from "@/lib/homepage-data";
import { fadeItem, staggerContainer } from "@/lib/motion";

const afterBenefits = [
  "Sub-minute lead response",
  "Spend routed to winning audiences",
  "Missed-call & after-hours capture",
  "Always-on nurture sequences",
  "Higher meeting & close rates",
];

export function ProblemsWeSolve() {
  return (
    <section className="relative border-b border-border/30 bg-muted/15 py-20 md:py-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/25 to-transparent" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-600 dark:text-violet-400">
            Problems we solve
          </p>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-[2.35rem] md:leading-tight">
            Stop paying for clicks that die in the inbox
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Diazites replaces fragmented tools with one unified layer—so every
            prospect gets a fast, on-brand experience in any niche.
          </p>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-16 grid gap-8 lg:grid-cols-2"
        >
          <motion.div
            variants={fadeItem}
            className="rounded-3xl border border-rose-500/20 bg-rose-500/[0.05] p-7 shadow-sm backdrop-blur-sm md:p-9"
          >
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
              <XCircle className="size-5 shrink-0" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                Before
              </span>
            </div>
            <h3 className="mt-5 text-xl font-semibold tracking-tight">
              Activity without a connected revenue story
            </h3>
            <ul className="mt-7 space-y-3">
              {problemPainPoints.map((p) => (
                <li
                  key={p}
                  className="flex items-start gap-3 rounded-2xl border border-rose-500/10 bg-background/50 px-4 py-3 text-sm dark:bg-black/20"
                >
                  <XCircle className="mt-0.5 size-4 shrink-0 text-rose-500/80" />
                  {p}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            variants={fadeItem}
            className="rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/[0.09] via-background/40 to-cyan-500/[0.06] p-7 shadow-[0_24px_70px_-48px_rgba(16,185,129,0.55)] backdrop-blur-sm md:p-9"
          >
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="size-5 shrink-0" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                After Diazites
              </span>
            </div>
            <h3 className="mt-5 text-xl font-semibold tracking-tight">
              Pipeline velocity with automation you can trust
            </h3>
            <ul className="mt-7 space-y-3">
              {afterBenefits.map((p) => (
                <li
                  key={p}
                  className="flex items-start gap-3 rounded-2xl border border-emerald-500/15 bg-background/60 px-4 py-3 text-sm dark:bg-black/30"
                >
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-9 flex items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-300">
              <ArrowRight className="size-4" aria-hidden />
              Configurable for your niche—not one-size templates
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
