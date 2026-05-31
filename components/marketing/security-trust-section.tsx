"use client";

import { ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

import { SECURITY_FEATURES } from "@/lib/marketing/platform-data";
import { fadeUp, staggerContainer } from "@/lib/motion";

export function SecurityTrustSection() {
  return (
    <section className="border-t border-white/[0.06] bg-white/[0.01] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              <ShieldCheck className="size-3.5" aria-hidden />
              Security & governance
            </motion.div>
            <motion.h2 variants={fadeUp} className="mt-4 text-2xl font-semibold tracking-tight sm:text-4xl">
              Built for serious business operations
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-muted-foreground">
              Agencies and operators trust Diazites with client data, ad accounts, and revenue
              workflows. Access is isolated, auditable, and entitlement-driven from day one.
            </motion.p>
          </motion.div>

          <motion.ul
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid gap-3 sm:grid-cols-2"
          >
            {SECURITY_FEATURES.map((feature) => (
              <motion.li
                key={feature}
                variants={fadeUp}
                className="flex items-start gap-2 rounded-xl border border-white/[0.08] bg-card/30 px-4 py-3 text-sm text-foreground/90"
              >
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-400" aria-hidden />
                {feature}
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </div>
    </section>
  );
}
