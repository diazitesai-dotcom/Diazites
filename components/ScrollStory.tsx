"use client";

import { motion } from "framer-motion";
import { SectionTitle } from "@/components/SectionTitle";

const pain = [
  "Missed calls",
  "Unanswered DMs",
  "No follow-up",
  "Manual admin work",
  "Lost customers",
];

const gain = [
  "Instant replies",
  "Automated workflows",
  "AI content creation",
  "Booked appointments",
  "More sales",
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function ScrollStory() {
  return (
    <section className="relative overflow-hidden border-t border-white/[0.05] px-5 py-28 sm:px-8">
      <div className="pointer-events-none absolute left-0 top-1/2 h-[120%] w-[60%] -translate-y-1/2 rounded-full bg-sky-900/15 blur-[120px]" />

      <SectionTitle
        title="Your Business Is Moving Too Slow Without AI"
        subtitle="Every unanswered message is revenue walking away. Diazites puts autonomous workers on the front line."
      />

      <div className="relative mx-auto mt-20 grid max-w-7xl gap-10 lg:grid-cols-2">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="rounded-2xl border border-rose-500/15 bg-rose-950/15 p-8 backdrop-blur-xl md:p-10"
        >
          <p className="mb-8 text-xs font-bold uppercase tracking-[0.3em] text-rose-400/90">
            Without AI
          </p>
          <div className="space-y-4">
            {pain.map((t) => (
              <motion.div
                key={t}
                variants={item}
                className="rounded-2xl border border-rose-500/15 bg-black/30 px-5 py-4 text-lg font-medium text-white/90"
              >
                {t}
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-950/35 to-indigo-950/25 p-8 backdrop-blur-xl md:p-10"
        >
          <p className="mb-8 text-xs font-bold uppercase tracking-[0.3em] text-cyan-400/90">
            With Diazites AI
          </p>
          <div className="space-y-4">
            {gain.map((t) => (
              <motion.div
                key={t}
                variants={item}
                className="rounded-2xl border border-cyan-500/20 bg-black/25 px-5 py-4 text-lg font-medium text-white shadow-[0_0_40px_-20px_rgba(34,211,238,0.35)]"
              >
                {t}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto mt-16 h-px max-w-md origin-center bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"
      />
    </section>
  );
}
