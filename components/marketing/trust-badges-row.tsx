"use client";

import { motion } from "framer-motion";

import { TRUST_BADGES } from "@/lib/marketing/platform-data";
import { fadeUp, staggerContainer } from "@/lib/motion";

export function TrustBadgesRow() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
      className="flex flex-wrap items-center justify-center gap-2 sm:gap-3"
    >
      {TRUST_BADGES.map((badge) => (
        <motion.span
          key={badge}
          variants={fadeUp}
          className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm transition hover:border-violet-500/30 hover:text-foreground"
        >
          {badge}
        </motion.span>
      ))}
    </motion.div>
  );
}
