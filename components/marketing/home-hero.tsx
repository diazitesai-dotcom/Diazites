"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Cpu } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fadeUp, staggerContainer } from "@/lib/motion";

const stats = [
  { label: "Leads orchestrated", value: "12k+" },
  { label: "Avg. CPL improvement", value: "38%" },
  { label: "Markets live", value: "40+" },
];

export function HomeHero() {
  return (
    <section className="relative overflow-hidden border-b border-white/[0.06]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.22),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.28),transparent)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.65] dark:surface-grid dark:opacity-100" />
      <div className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-60 surface-grid-light dark:hidden" />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-16 px-4 pb-24 pt-16 sm:px-6 md:pb-32 md:pt-24">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="mx-auto flex max-w-4xl flex-col items-center text-center"
        >
          <motion.div variants={fadeUp}>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground backdrop-blur-md">
              <Cpu className="size-3.5 text-violet-400" aria-hidden />
              Diazites AI Marketing Platform
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mt-8 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-6xl md:text-7xl"
          >
            <span className="block text-gradient-strong">
              Diazites,
            </span>
            <span className="block text-foreground">
              orchestrated by AI.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            Launch campaigns, automate intelligent follow-up, and convert more
            homeowners — all from one enterprise-grade workspace built for
            contractors who expect Stripe-level polish.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            <Link href="/signup">
              <Button variant="gradient" size="lg" className="gap-2 rounded-xl px-8">
                Start free
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            </Link>
            <Link
              href="/contact"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-xl px-8")}
            >
              Book a demo
            </Link>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mt-14 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3"
          >
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/[0.06] bg-card/40 px-5 py-4 text-left backdrop-blur-md dark:bg-white/[0.03]"
              >
                <p className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {s.value}
                </p>
                <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                  {s.label}
                </p>
              </div>
            ))}
          </motion.div>

          <motion.p
            variants={fadeUp}
            className="mt-10 text-xs uppercase tracking-[0.28em] text-muted-foreground"
          >
            Trusted by growth-focused roofing teams
          </motion.p>
          <motion.div
            variants={fadeUp}
            className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-70"
          >
            {["GAF Master Elite", "Owens Corning", "CertainTeed Select"].map(
              (name) => (
                <span
                  key={name}
                  className="text-sm font-medium tracking-tight text-muted-foreground"
                >
                  {name}
                </span>
              ),
            )}
          </motion.div>
        </motion.div>
      </div>
      <div className="pointer-events-none mx-auto h-px max-w-4xl bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
    </section>
  );
}
