"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  LayoutTemplate,
  Megaphone,
  MessageSquare,
  UserPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fadeItem, staggerContainer } from "@/lib/motion";

const steps = [
  { label: "Ad", icon: Megaphone, tone: "from-violet-600/20 to-blue-600/20" },
  { label: "Landing Page", icon: LayoutTemplate, tone: "from-blue-600/20 to-cyan-500/20" },
  { label: "Lead", icon: UserPlus, tone: "from-cyan-500/20 to-emerald-500/20" },
  { label: "AI Follow-Up", icon: MessageSquare, tone: "from-emerald-500/20 to-amber-500/20" },
  { label: "Booked call", icon: Calendar, tone: "from-amber-500/20 to-violet-500/20" },
];

export function LeadFunnelDemo() {
  return (
    <section className="border-b border-border/30 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-600 dark:text-violet-400">
            Lead funnel
          </p>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            From impression to revenue—in one system
          </h2>
          <p className="mt-4 text-muted-foreground">
            Traffic, capture, and nurture stay in sync so attribution isn’t a spreadsheet
            science project.
          </p>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-16"
        >
          <motion.div
            variants={fadeItem}
            className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-center lg:justify-between"
          >
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="flex items-center gap-4 lg:contents">
                  <div
                    className={`flex flex-1 flex-col items-center rounded-3xl border border-border/50 bg-gradient-to-br ${step.tone} px-5 py-6 text-center shadow-sm backdrop-blur-sm dark:bg-white/[0.02]`}
                  >
                    <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-background/85 shadow-inner ring-1 ring-white/10 dark:bg-black/45">
                      <Icon className="size-5 text-foreground" aria-hidden />
                    </div>
                    <p className="mt-4 text-sm font-semibold">{step.label}</p>
                  </div>
                  {i < steps.length - 1 ? (
                    <ArrowRight
                      className="hidden size-5 shrink-0 text-muted-foreground/70 lg:block"
                      aria-hidden
                    />
                  ) : null}
                </div>
              );
            })}
          </motion.div>

          <motion.div
            variants={fadeItem}
            className="mt-12 grid gap-10 rounded-3xl border border-border/50 bg-card/50 p-7 shadow-inner backdrop-blur-md md:grid-cols-2 md:p-10 dark:bg-white/[0.03]"
          >
            <div>
              <p className="text-sm font-semibold text-foreground">Live page preview</p>
              <p className="mt-1 text-sm text-muted-foreground">
                What prospects see after your ad—fast on mobile, tuned to your offer.
              </p>
              <div className="mt-6 space-y-3 rounded-2xl border border-dashed border-border/70 bg-muted/25 p-5 dark:bg-black/25">
                <div className="h-2 w-2/3 rounded-full bg-muted-foreground/20" />
                <div className="h-2 w-full rounded-full bg-muted-foreground/12" />
                <div className="h-2 w-5/6 rounded-full bg-muted-foreground/12" />
                <div className="mt-5 flex gap-2">
                  <div className="h-16 flex-1 rounded-xl bg-violet-500/12 ring-1 ring-white/5" />
                  <div className="h-16 flex-1 rounded-xl bg-blue-500/12 ring-1 ring-white/5" />
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Mini lead form</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Capture once—AI routes and follows up in seconds.
              </p>
              <form
                className="mt-6 space-y-4"
                onSubmit={(e) => e.preventDefault()}
              >
                <div className="space-y-2">
                  <Label htmlFor="demo-name">Full name</Label>
                  <Input id="demo-name" placeholder="Jordan Smith" readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="demo-phone">Phone</Label>
                  <Input id="demo-phone" type="tel" placeholder="(555) 000-0000" readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="demo-zip">ZIP / Region</Label>
                  <Input id="demo-zip" placeholder="94107" readOnly />
                </div>
                <Button type="button" variant="gradient" className="w-full rounded-2xl" disabled>
                  Request a call-back
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Static preview — connect your API when you ship.
                </p>
              </form>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
