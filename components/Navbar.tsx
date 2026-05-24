"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const links = [
  { href: "#what-we-do", label: "Vision" },
  { href: "#how-it-works", label: "Programs" },
  { href: "#agents", label: "Agents" },
  { href: "#workflow", label: "Demo" },
  { href: "#pricing", label: "Pricing" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 z-[100] w-full transition-all duration-500 ${
        scrolled
          ? "border-b border-white/[0.07] bg-[#0a1020]/82 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link
          href="#top"
          className="font-display text-lg font-medium tracking-tight text-white"
        >
          Diazites <span className="text-sky-300/90">AI</span>
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[13px] font-medium text-white/55 transition-colors hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-md border border-white/15 px-3 py-2 text-white md:hidden"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">Menu</span>
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          <motion.a
            href="#pricing"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="hidden items-center justify-center rounded-sm border border-white/35 bg-transparent px-6 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:border-white/60 hover:bg-white hover:text-black sm:inline-flex"
          >
            Get on board
          </motion.a>
        </div>
      </div>

      {open ? (
        <div className="border-t border-white/[0.07] bg-[#0a1020]/98 px-5 py-4 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-3">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="py-2 text-sm font-medium text-white/75"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </a>
            ))}
            <a
              href="#pricing"
              className="mt-3 border border-white/30 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-white"
              onClick={() => setOpen(false)}
            >
              Get on board
            </a>
          </div>
        </div>
      ) : null}
    </motion.header>
  );
}
