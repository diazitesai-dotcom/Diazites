"use client";

import { motion } from "framer-motion";
import { CalendarCheck, Megaphone, TrendingUp, Zap } from "lucide-react";

import { howItWorksSteps } from "@/lib/homepage-data";
import { fadeItem, staggerContainer } from "@/lib/motion";

const icons = {
  magnet: Megaphone,
  zap: Zap,
  calendar: CalendarCheck,
  trending: TrendingUp,
} as const;

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 border-b border-border/30 py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-600 dark:text-violet-400">
            How it works
          </p>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            A loop engineered for modern acquisition
          </h2>
          <p className="mt-4 text-muted-foreground">
            From first touch to booked conversation—measure everything, optimize
            continuously, repeat.
          </p>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {howItWorksSteps.map((step, i) => {
            const Icon = icons[step.icon];
            return (
              <motion.div
                key={step.title}
                variants={fadeItem}
                className="group relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-b from-card/90 to-card/40 p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/30 hover:shadow-[0_24px_60px_-36px_rgba(99,102,241,0.45)] dark:from-white/[0.05] dark:to-transparent"
              >
                <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-violet-500/10 blur-2xl transition-opacity group-hover:opacity-100" />
                <div className="mb-5 inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600/20 to-cyan-500/15 text-violet-700 ring-1 ring-white/10 dark:text-violet-200">
                  <Icon className="size-5" aria-hidden />
                </div>
                <div className="absolute right-5 top-5 font-mono text-[10px] font-medium tabular-nums text-muted-foreground/50">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="text-lg font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
