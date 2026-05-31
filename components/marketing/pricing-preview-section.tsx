"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { PRICING_PREVIEW_PLANS } from "@/lib/marketing/platform-data";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";

function formatLimit(value: number | null | string | undefined): string {
  if (value === null || value === undefined) return "Unlimited";
  if (typeof value === "string") return value;
  return value.toLocaleString();
}

export function PricingPreviewSection() {
  return (
    <section id="pricing" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.p variants={fadeUp} className="text-xs font-medium uppercase tracking-[0.22em] text-violet-400">
            Pricing
          </motion.p>
          <motion.h2 variants={fadeUp} className="mt-3 text-2xl font-semibold tracking-tight sm:text-4xl">
            Plans that scale with your growth system
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-muted-foreground">
            Start with a 14-day trial. Upgrade when you need more agents, subaccounts, or merchant
            automation.
          </motion.p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
          className="mt-12 grid gap-6 lg:grid-cols-4"
        >
          {PRICING_PREVIEW_PLANS.map((plan) => (
            <motion.article
              key={plan.name}
              variants={fadeUp}
              className={cn(
                "relative flex flex-col rounded-2xl border p-6 backdrop-blur-sm",
                plan.recommended
                  ? "border-violet-500/40 bg-gradient-to-b from-violet-500/10 to-transparent shadow-[0_0_40px_-12px_rgba(139,92,246,0.45)]"
                  : "border-white/[0.08] bg-card/30",
              )}
            >
              {plan.recommended ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-500 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                  Recommended
                </span>
              ) : null}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              <p className="mt-4 text-3xl font-semibold tracking-tight">
                {plan.customPricing ? (
                  "Custom"
                ) : (
                  <>
                    ${plan.priceMonthly}
                    <span className="text-base font-normal text-muted-foreground">/mo</span>
                  </>
                )}
              </p>
              <ul className="mt-6 flex-1 space-y-2 text-sm text-muted-foreground">
                <li>Users: {formatLimit(plan.limits.users)}</li>
                <li>AI agents: {formatLimit(plan.limits.agents)}</li>
                <li>Subaccounts: {formatLimit(plan.limits.subaccounts)}</li>
                <li>Ad accounts: {formatLimit(plan.limits.campaigns)}</li>
                <li>Landing pages: {formatLimit(plan.limits.landingPages)}</li>
                <li>Email/mo: {formatLimit(plan.limits.emails)}</li>
                <li>Merchant: {plan.limits.merchant ? "Included" : "Add-on"}</li>
                <li>Support: {plan.limits.support}</li>
              </ul>
              <ul className="mt-4 space-y-2 border-t border-white/[0.06] pt-4">
                {plan.features
                  .filter((f) => !/sms|text\/sms|twilio/i.test(f))
                  .slice(0, 4)
                  .map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-foreground/80">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-violet-400" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="mt-6">
                <Button
                  variant={plan.recommended ? "gradient" : "outline"}
                  className="w-full rounded-xl"
                >
                  {plan.customPricing ? "Talk to sales" : "Start free trial"}
                  <ArrowRight className="ml-1 size-4" aria-hidden />
                </Button>
              </Link>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
