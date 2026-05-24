"use client";

import { motion } from "framer-motion";
import { SectionTitle } from "@/components/SectionTitle";

const industries = [
  { label: "Contractors", grad: "from-orange-600/40 to-amber-900/40" },
  { label: "Roofers", grad: "from-slate-600/50 to-sky-900/40" },
  { label: "Barbershops", grad: "from-zinc-700/50 to-neutral-900/40" },
  { label: "Cleaning companies", grad: "from-cyan-700/40 to-blue-950/40" },
  { label: "Nonprofits", grad: "from-violet-700/40 to-indigo-950/40" },
  { label: "Restaurants", grad: "from-rose-700/40 to-red-950/40" },
  { label: "Coaches", grad: "from-fuchsia-700/40 to-purple-950/40" },
  { label: "Real estate agents", grad: "from-emerald-700/40 to-teal-950/40" },
];

export function Industries() {
  return (
    <section id="industries" className="scroll-mt-28 px-5 py-28 sm:px-8">
      <SectionTitle
        eyebrow="Industries"
        title="Built for operators who can’t afford to miss a single lead"
      />

      <div className="mx-auto mt-16 grid max-w-7xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {industries.map((ind, i) => (
          <motion.div
            key={ind.label}
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.03, y: -4 }}
            className={`relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${ind.grad} p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
            <p className="relative z-10 text-xl font-bold tracking-tight text-white drop-shadow-md">
              {ind.label}
            </p>
            <span className="relative z-10 mt-2 inline-block text-xs font-medium uppercase tracking-wider text-white/70">
              Diazites ready
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
