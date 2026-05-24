"use client";

import { motion } from "framer-motion";
import { Bot } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { marketingAgents } from "@/lib/homepage-data";
import { fadeItem, staggerContainer } from "@/lib/motion";

export function Agents() {
  return (
    <section
      id="agents"
      className="scroll-mt-24 border-b border-border/30 bg-gradient-to-b from-muted/25 via-background to-background py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-600 dark:text-violet-400">
            AI marketing agents
          </p>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Scale growth like a modern stack
          </h2>
          <p className="mt-4 text-muted-foreground">
            Dedicated agents for acquisition, conversion, and nurture—aligned to your
            brand voice and guardrails.
          </p>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {marketingAgents.map((agent) => (
            <motion.div key={agent.title} variants={fadeItem}>
              <Card className="group h-full rounded-3xl border-border/60 bg-card/70 transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/25 hover:shadow-[0_20px_60px_-40px_rgba(99,102,241,0.35)] dark:bg-white/[0.03]">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/15 to-cyan-500/10 text-violet-700 ring-1 ring-white/10 dark:text-violet-300">
                      <Bot className="size-5" aria-hidden />
                    </div>
                    <Badge variant="secondary" className="shrink-0 rounded-full font-medium">
                      {agent.badge}
                    </Badge>
                  </div>
                  <CardTitle className="mt-5 text-lg leading-snug">{agent.title}</CardTitle>
                  <CardDescription className="text-[15px] leading-relaxed">
                    {agent.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
