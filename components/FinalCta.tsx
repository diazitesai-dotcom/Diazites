"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function FinalCta() {
  return (
    <section
      id="final-cta"
      className="relative scroll-mt-28 border-t border-white/[0.05] px-5 py-32 text-center sm:px-8"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_65%_at_50%_50%,rgba(30,58,138,0.22),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_85%_25%,rgba(56,189,248,0.08),transparent)]" />

      <motion.div
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative mx-auto max-w-4xl"
      >
        <h2 className="font-display text-balance text-4xl font-light tracking-tight text-white md:text-5xl lg:text-[3.25rem]">
          Stop running your business alone
        </h2>
        <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-white/50 md:text-xl">
          Hire AI agents that handle the busy work, follow up faster, and help you close
          more customers—around the clock.
        </p>

        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <motion.a
            href="#pricing"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.99 }}
            className="inline-flex items-center gap-2 rounded-sm border border-white/25 bg-white px-9 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-white/95"
          >
            Hire AI agent
            <ArrowRight className="size-4" />
          </motion.a>
          <motion.a
            href="#workflow"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.99 }}
            className="inline-flex items-center gap-2 rounded-sm border border-white/15 bg-transparent px-9 py-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/90 transition hover:border-white/35 hover:bg-white/[0.04]"
          >
            Book demo
          </motion.a>
        </div>
      </motion.div>
    </section>
  );
}
