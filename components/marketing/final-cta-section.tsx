"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

import { Button, buttonVariants } from "@/components/ui/button";
import { fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function FinalCtaSection() {
  return (
    <section className="py-20 sm:py-28">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        variants={fadeUp}
        className="mx-auto max-w-4xl rounded-3xl border border-violet-500/25 bg-gradient-to-br from-violet-500/15 via-transparent to-cyan-500/10 px-6 py-14 text-center sm:px-12"
      >
        <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-4xl">
          Turn ads, leads, follow-up, payments, and reporting into one automated AI workflow
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Create your workspace, activate agents, connect your stack, and launch from Mission Control
          in minutes — not weeks.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/signup">
            <Button variant="gradient" size="lg" className="gap-2 rounded-xl px-8">
              Start Building Your AI Growth System
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </Link>
          <Link href="#pricing" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-xl px-8")}>
            View plans
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
