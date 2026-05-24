"use client";

import { motion } from "framer-motion";
import { Plug, Rocket, Settings2, Workflow } from "lucide-react";
import { SectionTitle } from "@/components/SectionTitle";

const steps = [
  {
    n: "01",
    title: "Choose the work you need done",
    body: "Define outcomes—leads, bookings, content, ads—and where they should land.",
    icon: Settings2,
  },
  {
    n: "02",
    title: "Pick your AI agent",
    body: "Match a specialist agent to the job. Stack multiple agents as you scale.",
    icon: Rocket,
  },
  {
    n: "03",
    title: "Connect your tools",
    body: "CRM, inbox, calendar, ads—agents operate inside the stack you already use.",
    icon: Plug,
  },
  {
    n: "04",
    title: "Watch the agent work",
    body: "Live queues, transcripts, and KPIs so you always see value—not black boxes.",
    icon: Workflow,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-28 px-5 py-28 sm:px-8">
      <SectionTitle
        eyebrow="How it works"
        title="From intent to execution—in four moves"
      />

      <div className="mx-auto mt-16 max-w-7xl">
        <div className="relative lg:hidden">
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {steps.map((s, i) => (
              <StepCard key={s.n} step={s} index={i} className="min-w-[85vw] snap-center sm:min-w-[360px]" />
            ))}
          </div>
        </div>

        <div className="hidden gap-6 lg:grid lg:grid-cols-4">
          {steps.map((s, i) => (
            <StepCard key={s.n} step={s} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StepCard({
  step,
  index,
  className = "",
}: {
  step: (typeof steps)[0];
  index: number;
  className?: string;
}) {
  const Icon = step.icon;
  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.12, duration: 0.55 }}
      whileHover={{ y: -6 }}
      className={`relative flex flex-col rounded-3xl border border-white/[0.08] bg-white/[0.03] p-7 backdrop-blur-xl ${className}`}
    >
      <span className="font-mono text-xs text-white/35">{step.n}</span>
      <div className="mt-5 inline-flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-cyan-500/20 ring-1 ring-white/10">
        <Icon className="size-5 text-cyan-300" />
      </div>
      <h3 className="mt-6 text-lg font-semibold text-white">{step.title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-white/50">{step.body}</p>
    </motion.article>
  );
}
