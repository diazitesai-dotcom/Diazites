"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Cpu, Play } from "lucide-react";

import { HeroBackgroundVideo } from "@/components/marketing/hero-background-video";
import { TrustBadgesRow } from "@/components/marketing/trust-badges-row";
import { Button, buttonVariants } from "@/components/ui/button";
import { BRAND_HEADLINE, BRAND_SUBHEADLINE } from "@/lib/marketing/platform-data";
import { cn } from "@/lib/utils";
import { fadeUp, staggerContainer } from "@/lib/motion";

export function HomeHero() {
  const headlineParts = BRAND_HEADLINE.split(" — ");
  const title = headlineParts[0] ?? "Diazites";
  const tagline = headlineParts[1] ?? "The AI Growth Operating System";

  return (
    <section className="relative min-h-[min(92vh,900px)] overflow-hidden border-b border-white/[0.06]">
      <HeroBackgroundVideo />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.22),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.28),transparent)]" />
      <div className="pointer-events-none absolute inset-0 opacity-30 dark:surface-grid dark:opacity-50" />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-24 pt-16 sm:px-6 md:pb-32 md:pt-24">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="mx-auto flex max-w-4xl flex-col items-center text-center"
        >
          <motion.div variants={fadeUp}>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground backdrop-blur-md">
              <Cpu className="size-3.5 text-violet-400" aria-hidden />
              AI Growth Operating System
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mt-8 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl"
          >
            <span className="block text-gradient-strong">{title}</span>
            <span className="mt-2 block text-foreground/95">{tagline}</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            {BRAND_SUBHEADLINE}
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            <Link href="/signup">
              <Button variant="gradient" size="lg" className="gap-2 rounded-xl px-8">
                Start Building Your AI Growth System
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            </Link>
            <Link
              href="#platform"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "gap-2 rounded-xl px-8")}
            >
              <Play className="size-4" aria-hidden />
              See How It Works
            </Link>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-10 w-full max-w-3xl">
            <TrustBadgesRow />
          </motion.div>
        </motion.div>
      </div>
      <div className="pointer-events-none mx-auto h-px max-w-4xl bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
    </section>
  );
}
