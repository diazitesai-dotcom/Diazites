"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Star } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { HERO_VIDEO_EMBED } from "@/lib/homepage-data";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/30">
      {/* Mesh + glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_30%_-40%,rgba(99,102,241,0.35),transparent_55%)] dark:bg-[radial-gradient(ellipse_120%_80%_at_30%_-40%,rgba(99,102,241,0.28),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_100%_10%,rgba(34,211,238,0.18),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_0%_100%,rgba(168,85,247,0.15),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.4] dark:surface-grid dark:opacity-[0.22]" />

      <div className="relative mx-auto grid max-w-6xl gap-14 px-4 pb-24 pt-16 sm:px-6 md:grid-cols-2 md:items-center md:gap-16 md:pb-32 md:pt-24">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="flex flex-col justify-center"
        >
          <motion.div variants={fadeUp}>
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-gradient-to-r from-violet-500/15 to-cyan-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] dark:text-violet-200">
              <Sparkles className="size-3.5 text-cyan-400" aria-hidden />
              AI growth infrastructure
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mt-7 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[3.35rem] lg:leading-[1.06]"
          >
            Turn Attention Into Revenue—
            <span className="bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent dark:from-violet-400 dark:via-blue-400 dark:to-cyan-400">
              {" "}
              On Autopilot
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            Diazites unifies ads, landing pages, and AI follow-up so every niche
            business can capture demand, respond instantly, and book qualified
            conversations—without hiring a full marketing department.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Link
              href="/contact"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full rounded-2xl border-border/60 bg-background/60 px-8 backdrop-blur-md sm:w-auto dark:bg-white/[0.04]",
              )}
            >
              Book Demo
            </Link>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mt-11 flex flex-wrap items-center gap-5 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-5 py-4 backdrop-blur-xl dark:bg-black/25"
          >
            <div className="flex -space-x-2.5" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="size-10 rounded-full border-2 border-background bg-gradient-to-br from-violet-500/30 via-muted to-cyan-500/25 shadow-inner"
                />
              ))}
            </div>
            <div>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="size-4 fill-amber-400 text-amber-400"
                    aria-hidden
                  />
                ))}
              </div>
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                Trusted by operators across industries
              </p>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex items-center"
        >
          <div
            className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-violet-600/25 via-transparent to-cyan-500/20 blur-2xl"
            aria-hidden
          />
          <div className="relative w-full overflow-hidden rounded-3xl border border-white/[0.12] bg-black/[0.03] shadow-[0_32px_100px_-40px_rgba(59,130,246,0.55)] ring-1 ring-white/[0.06] dark:bg-black/50">
            <div className="aspect-video w-full">
              <iframe
                src={`${HERO_VIDEO_EMBED}?rel=0`}
                title="Diazites platform overview"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="size-full"
              />
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/80 to-transparent px-5 py-4">
              <p className="text-center text-xs font-medium tracking-wide text-muted-foreground">
                Product tour · AI funnel & follow-up
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
