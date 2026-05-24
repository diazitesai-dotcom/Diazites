"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { pricingTiers } from "@/lib/homepage-data";
import { fadeItem, staggerContainer } from "@/lib/motion";

export function Pricing() {
  return (
    <section
      id="pricing"
      className="scroll-mt-24 border-b border-border/30 bg-muted/20 py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-600 dark:text-violet-400">
            Pricing
          </p>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Plans that scale with your ambition
          </h2>
          <p className="mt-4 text-muted-foreground">
            Start lean, graduate when volume and complexity demand it—no shelfware.
          </p>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-14 grid gap-8 lg:grid-cols-3"
        >
          {pricingTiers.map((tier) => (
            <motion.div
              key={tier.name}
              variants={fadeItem}
              className={cn(
                "relative flex flex-col rounded-3xl border bg-card/90 p-8 shadow-sm transition-all duration-300 dark:bg-white/[0.04]",
                tier.highlighted
                  ? "border-violet-500/40 shadow-[0_24px_80px_-40px_rgba(99,102,241,0.45)] ring-1 ring-violet-500/20"
                  : "border-border/70 hover:border-border",
              )}
            >
              {tier.highlighted ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-lg">
                  Most popular
                </div>
              ) : null}
              <div className="text-center lg:text-left">
                <h3 className="text-lg font-semibold">{tier.name}</h3>
                <div className="mt-4 flex items-baseline justify-center gap-1 lg:justify-start">
                  <span className="text-4xl font-semibold tracking-tight">{tier.price}</span>
                  <span className="text-muted-foreground">{tier.period}</span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{tier.description}</p>
              </div>
              <ul className="mt-8 flex flex-1 flex-col gap-3 text-sm">
                {tier.features.map((f) => (
                  <li key={f} className="flex gap-3">
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="mt-10">
                <Button
                  variant={tier.highlighted ? "gradient" : "outline"}
                  size="lg"
                  className="w-full rounded-2xl"
                >
                  {tier.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Need a custom rollout across locations?{" "}
          <Link
            href="/contact"
            className={cn(
              buttonVariants({ variant: "link", size: "sm" }),
              "h-auto p-0 text-violet-600 dark:text-violet-400",
            )}
          >
            Book a strategy call
          </Link>
        </p>
      </div>
    </section>
  );
}
