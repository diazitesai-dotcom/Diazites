"use client";

import { motion } from "framer-motion";

import { CAPABILITY_METRICS } from "@/lib/marketing/platform-data";
import { fadeUp, staggerContainer } from "@/lib/motion";

export function CapabilityMetricsSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.p variants={fadeUp} className="text-xs font-medium uppercase tracking-[0.22em] text-violet-400">
            Platform capabilities
          </motion.p>
          <motion.h2 variants={fadeUp} className="mt-3 text-2xl font-semibold tracking-tight sm:text-4xl">
            Built for operators who need leverage, not another dashboard
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-muted-foreground">
            Real capability metrics — no inflated vanity numbers. Diazites ships the modules you
            need to run growth end-to-end.
          </motion.p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {CAPABILITY_METRICS.map((metric) => (
            <motion.div
              key={metric.label}
              variants={fadeUp}
              className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-transparent p-6 backdrop-blur-sm"
            >
              <p className="text-3xl font-semibold tracking-tight text-gradient-strong">{metric.value}</p>
              <p className="mt-2 text-sm text-muted-foreground">{metric.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
