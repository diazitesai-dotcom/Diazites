"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fadeUp } from "@/lib/motion";

export function FinalCta() {
  return (
    <section className="border-b border-border/30 py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08 } },
          }}
          className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-violet-600/95 via-blue-700/95 to-cyan-600/90 px-6 py-16 text-center shadow-[0_40px_120px_-60px_rgba(59,130,246,0.65)] sm:px-14"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_-30%,rgba(255,255,255,0.22),transparent)]" />
          <div className="pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay [background-image:linear-gradient(120deg,transparent_40%,rgba(255,255,255,0.15)_50%,transparent_60%)]" />
          <div className="relative mx-auto max-w-2xl">
            <motion.h2
              variants={fadeUp}
              className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl"
            >
              Don&apos;t Lose Deals to Teams That Reply Faster
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-lg text-white/90">
              Put acquisition and follow-up on autopilot—while you focus on delivery
              and closing.
            </motion.p>
            <motion.div
              variants={fadeUp}
              className="mt-11 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <Link
                href="/contact"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "w-full rounded-2xl border-white/35 bg-white/10 px-8 text-white backdrop-blur-md hover:bg-white/20 sm:w-auto",
                )}
              >
                Book Demo
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
