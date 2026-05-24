"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fadeUp } from "@/lib/motion";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    window.setTimeout(() => setStatus("success"), 900);
  }

  return (
    <section id="contact" className="scroll-mt-24 border-t border-border/30 bg-muted/10 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.06 } },
            }}
          >
            <motion.p
              variants={fadeUp}
              className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-600 dark:text-violet-400"
            >
              Contact
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              Let&apos;s talk about your funnel
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-muted-foreground">
              Share context on your niche, volume, and goals—we&apos;ll respond with a
              concrete next step. No spam.
            </motion.p>
            <motion.ul
              variants={fadeUp}
              className="mt-8 space-y-3 text-sm text-muted-foreground"
            >
              <li className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-violet-500" />
                Average reply within one business day
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-blue-500" />
                Built for operators—not slide decks
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-cyan-500" />
                We&apos;ll suggest the right tier—not a one-size upsell
              </li>
            </motion.ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="rounded-3xl border border-border/60 bg-card/90 p-6 shadow-xl backdrop-blur-md dark:bg-white/[0.04] md:p-8"
          >
            {status === "success" ? (
              <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                <CheckCircle2 className="size-12 text-emerald-500" aria-hidden />
                <div>
                  <p className="text-lg font-semibold">Thanks — you&apos;re on the list.</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    This demo form doesn&apos;t send email yet. Wire your API route here when
                    you&apos;re ready.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setStatus("idle")}
                >
                  Send another message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="contact-name">Name</Label>
                  <Input
                    id="contact-name"
                    name="name"
                    required
                    autoComplete="name"
                    placeholder="Alex Rivera"
                    disabled={status === "loading"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Email</Label>
                  <Input
                    id="contact-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="alex@yourcompany.com"
                    disabled={status === "loading"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-phone">Phone</Label>
                  <Input
                    id="contact-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="(555) 123-4567"
                    disabled={status === "loading"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-message">Message</Label>
                  <Textarea
                    id="contact-message"
                    name="message"
                    required
                    rows={4}
                    placeholder="Niche, monthly volume, tools you use, and what you want to fix first."
                    className="min-h-[120px] rounded-xl border-input bg-background/40 px-3 py-2 md:text-sm dark:bg-white/[0.04]"
                    disabled={status === "loading"}
                  />
                </div>
                <Button
                  type="submit"
                  variant="gradient"
                  size="lg"
                  className="w-full rounded-xl"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      Sending…
                    </>
                  ) : (
                    "Request follow-up"
                  )}
                </Button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
