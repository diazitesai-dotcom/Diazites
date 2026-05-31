"use client";

import { motion } from "framer-motion";

import { INTEGRATION_PARTNERS } from "@/lib/marketing/platform-data";
import { fadeUp, staggerContainer } from "@/lib/motion";

export function TrustIntegrationsSection() {
  return (
    <section className="border-y border-white/[0.06] bg-white/[0.01] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="text-center"
        >
          <motion.p variants={fadeUp} className="text-xs font-medium uppercase tracking-[0.22em] text-violet-400">
            Integrations
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="mt-3 text-balance text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            Built to connect with tools like…
          </motion.h2>
          <motion.p variants={fadeUp} className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Diazites is designed to plug into the stack you already use — ads, auth, payments,
            email, and AI — without locking you into a single vendor.
          </motion.p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
          className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
        >
          {INTEGRATION_PARTNERS.map((partner) => (
            <motion.div
              key={partner.slug}
              variants={fadeUp}
              className="flex min-h-[72px] items-center justify-center rounded-xl border border-white/[0.08] bg-card/40 px-4 py-3 text-center text-sm font-medium text-foreground/90 backdrop-blur-sm transition hover:border-violet-500/25 hover:bg-violet-500/[0.06]"
            >
              {partner.name}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
