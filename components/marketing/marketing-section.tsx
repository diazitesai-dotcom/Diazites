"use client";

import { motion } from "framer-motion";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fadeUp, staggerContainer } from "@/lib/motion";

type SectionCard = {
  title: string;
  description: string;
};

const cards: SectionCard[] = [
  {
    title: "How it works",
    description:
      "Campaign intake, routing rules, and AI agents coordinated from a single control plane.",
  },
  {
    title: "Problems we solve",
    description:
      "Fragmented leads, slow follow-up, and opaque performance — replaced with clarity and speed.",
  },
  {
    title: "AI agents",
    description:
      "Specialized agents for ads, landing pages, qualification, and follow-up — monitored end-to-end.",
  },
  {
    title: "Lead funnel demo",
    description:
      "Spin up conversion-ready funnels with preview + capture wired to your CRM pipeline.",
  },
  {
    title: "Pricing",
    description:
      "Plans that scale with your markets. Stripe-ready billing when you turn on monetization.",
  },
  {
    title: "FAQ & contact",
    description:
      "Talk to our team for rollout timelines, integrations, and enterprise security review.",
  },
];

export function MarketingModulesSection() {
  return (
    <section id="modules" className="border-b border-border/60 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.p variants={fadeUp} className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Platform surface
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="mt-4 text-balance text-3xl font-semibold tracking-tight md:text-4xl"
          >
            Everything your revenue team needs —{" "}
            <span className="text-gradient">without the clutter.</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-muted-foreground md:text-lg">
            Structured modules mirror how elite SaaS teams ship: sharp hierarchy,
            dense capability, zero noise.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
          variants={staggerContainer}
          className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {cards.map((c) => (
            <motion.div key={c.title} variants={fadeUp}>
              <Card className="h-full border-white/[0.06] bg-card/50 transition-transform duration-300 hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="text-lg">{c.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {c.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-px w-full bg-gradient-to-r from-violet-500/40 via-transparent to-cyan-400/30" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export function MarketingPlatformSection() {
  return (
    <section id="platform" className="py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-4"
        >
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            AI-native OS
          </p>
          <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            Pipeline intelligence that feels{" "}
            <span className="text-gradient">instant.</span>
          </h2>
          <p className="text-muted-foreground md:text-lg">
            Dark-first UI, glass surfaces, and motion that communicates state —
            so operators trust the system at a glance.
          </p>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-400 to-cyan-400" />
              Unified signals across campaigns, CRM, and AI messaging.
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-400 to-cyan-400" />
              Enterprise guardrails with room to move fast.
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-400 to-cyan-400" />
              Designed like the tools your team already loves.
            </li>
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-2xl border border-white/[0.08] bg-gradient-to-br from-card/90 to-card/40 p-6 shadow-[0_24px_80px_-40px_rgba(99,102,241,0.35)] backdrop-blur-xl"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-violet-600/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 size-56 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="relative space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-4 py-3">
              <span className="text-xs font-medium text-muted-foreground">
                AI workflow
              </span>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                Live
              </span>
            </div>
            <div className="space-y-2 rounded-xl border border-white/10 bg-black/25 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Processing
              </p>
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  className="h-full w-2/3 rounded-full bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-400"
                  initial={{ x: "-20%", opacity: 0.6 }}
                  animate={{ x: ["-20%", "30%", "-10%"], opacity: [0.6, 1, 0.75] }}
                  transition={{
                    duration: 2.8,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                />
              </div>
              <p className="text-sm text-foreground">
                Qualifying lead · assigning agent · drafting follow-up
              </p>
            </div>
            <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-4 text-sm text-muted-foreground">
              Smart message preview appears here with tone controls and compliance
              checks — ready for operator review.
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
