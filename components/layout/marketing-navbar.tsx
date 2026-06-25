"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { ThemeToggle } from "@/components/ui/theme-toggle";

const links = [
  { href: "#platform", label: "Platform" },
  { href: "#platform", label: "Modules" },
  { href: "#pricing", label: "Pricing" },
  { href: "/docs/agents", label: "Agent API" },
  { href: "/contact", label: "Contact" },
];

export function MarketingNavbar() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 border-b border-white/[0.06] bg-background/70 backdrop-blur-xl dark:border-white/[0.06]"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 text-sm font-bold text-white shadow-[0_0_28px_-8px_rgba(99,102,241,0.65)]">
            D
          </span>
          <span className="hidden text-sm sm:inline">Diazites</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login">
            <span className="hidden rounded-xl px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground sm:inline-flex">
              Log in
            </span>
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
