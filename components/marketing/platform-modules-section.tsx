"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CreditCard,
  FileText,
  GitBranch,
  LineChart,
  Megaphone,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";

import { fadeUp, staggerContainer } from "@/lib/motion";

const MODULES = [
  {
    icon: Bot,
    title: "AI Agent Command Center",
    description:
      "Deploy CRM, Ads, Follow-Up, Email, Landing Page, and Task agents from one control plane.",
    href: "/signup",
  },
  {
    icon: Users,
    title: "CRM & Pipelines",
    description:
      "Capture leads, move deals through stages, and trigger automations when momentum changes.",
    href: "/signup",
  },
  {
    icon: FileText,
    title: "Landing Page Studio",
    description:
      "Create pages, edit copy, upload media, choose form fields, A/B versions, and track conversions.",
    href: "/signup",
  },
  {
    icon: Megaphone,
    title: "Campaign Operations",
    description: "Connect Google and Meta, launch campaigns, and tie spend back to pipeline value.",
    href: "/signup",
  },
  {
    icon: GitBranch,
    title: "Workflow Automations",
    description:
      "Turn ads, leads, follow-up, payments, and reporting into one automated AI workflow.",
    href: "/signup",
  },
  {
    icon: CreditCard,
    title: "Payments & Merchant Services",
    description:
      "Stripe-first: card payments, ACH, invoices, payment links, subscriptions, and transaction history.",
    href: "/signup",
  },
  {
    icon: LineChart,
    title: "Analytics & Growth Score",
    description:
      "Track leads, campaigns, pipeline value, revenue, and recommended next actions in Mission Control.",
    href: "/signup",
  },
] as const;

export function PlatformModulesSection() {
  return (
    <section className="border-t border-white/[0.06] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.p variants={fadeUp} className="text-xs font-medium uppercase tracking-[0.22em] text-violet-400">
            Platform modules
          </motion.p>
          <motion.h2 variants={fadeUp} className="mt-3 text-2xl font-semibold tracking-tight sm:text-4xl">
            One operating system for revenue, not ten disconnected tabs
          </motion.h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <motion.div
                key={mod.title}
                variants={fadeUp}
                className="group flex flex-col rounded-2xl border border-white/[0.08] bg-card/30 p-6 transition hover:border-violet-500/30 hover:bg-violet-500/[0.04]"
              >
                <span className="flex size-10 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/10">
                  <Icon className="size-5 text-violet-400" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{mod.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {mod.description}
                </p>
                <Link
                  href={mod.href}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-violet-400 transition group-hover:gap-2"
                >
                  Start building
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
