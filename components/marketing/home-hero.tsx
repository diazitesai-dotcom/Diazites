"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Cpu, Globe2, Mail, Play, Sparkles } from "lucide-react";

import { HeroBackgroundVideo } from "@/components/marketing/hero-background-video";
import { TrustBadgesRow } from "@/components/marketing/trust-badges-row";
import { buttonVariants } from "@/components/ui/button";
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

          <motion.div variants={fadeUp} className="mt-10 w-full max-w-3xl">
            <form
              action="/signup"
              className="rounded-3xl border border-violet-400/20 bg-black/30 p-4 text-left shadow-[0_24px_90px_rgba(124,58,237,0.24)] backdrop-blur-xl sm:p-5"
            >
              <div className="mb-4 flex flex-col gap-2 text-center sm:text-left">
                <span className="inline-flex w-fit items-center gap-2 self-center rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100 sm:self-start">
                  <Sparkles className="size-3.5" aria-hidden />
                  Try the AI Launch Setup free
                </span>
                <p className="text-sm leading-6 text-slate-300">
                  Enter your website and email. After signup, Diazites scans your business,
                  builds your setup, and shows how your AI agents can capture and follow up with leads.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-[1.2fr_1fr]">
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    <Globe2 className="size-3.5 text-violet-300" />
                    Website URL
                  </span>
                  <input
                    name="website"
                    type="url"
                    placeholder="https://yourbusiness.com"
                    className="w-full rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-300/15"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    <Mail className="size-3.5 text-violet-300" />
                    Email
                  </span>
                  <input
                    name="email"
                    type="email"
                    placeholder="you@business.com"
                    className="w-full rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-300/15"
                  />
                </label>
              </div>
              <input name="source" type="hidden" value="ai-launch" />
              <button
                type="submit"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-5 py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-[0_18px_60px_rgba(34,211,238,0.2)] transition hover:scale-[1.01] sm:w-auto"
              >
                Start AI Setup Free
                <ArrowRight className="size-4" aria-hidden />
              </button>
            </form>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mt-4 flex flex-wrap items-center justify-center gap-3"
          >
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
