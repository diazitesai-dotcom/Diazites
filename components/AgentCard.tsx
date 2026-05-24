"use client";

import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

type AgentCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  index?: number;
};

export function AgentCard({ title, description, icon: Icon, index = 0 }: AgentCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, scale: 1.02 }}
      className="group relative flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.025] p-7 backdrop-blur-xl transition-all duration-300 hover:border-sky-500/25 hover:bg-white/[0.04]"
    >
      <div className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-gradient-to-br from-sky-600/20 to-indigo-600/15 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="flex items-start justify-between gap-4">
        <div className="flex size-12 items-center justify-center rounded-xl bg-white/[0.05] ring-1 ring-white/[0.08]">
          <Icon className="size-6 text-sky-300/90" aria-hidden />
        </div>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
          Active
        </span>
      </div>

      <h3 className="mt-6 text-xl font-semibold tracking-tight text-white">{title}</h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-white/50">{description}</p>

      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        className="mt-8 w-full rounded-sm border border-white/15 bg-transparent py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/90 transition-colors hover:border-white/35 hover:bg-white/[0.06]"
        onClick={() => {
          document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
        }}
      >
        Hire Agent
      </motion.button>
    </motion.div>
  );
}
