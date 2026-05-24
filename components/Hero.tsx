"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ChevronDown, Play } from "lucide-react";

const feedItems = [
  { label: "New lead captured", tone: "from-slate-700/50 to-slate-800/40" },
  { label: "AI reply sent", tone: "from-sky-950/60 to-slate-900/40" },
  { label: "Appointment booked", tone: "from-emerald-950/40 to-slate-900/35" },
  { label: "Invoice follow-up complete", tone: "from-indigo-950/45 to-slate-900/35" },
];

function scrollToMissionVideo() {
  document.getElementById("mission-video")?.scrollIntoView({ behavior: "smooth" });
}

export function Hero() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const { scrollYProgress } = useScroll();
  const titleY = useTransform(scrollYProgress, [0, 0.35], [0, -48]);
  const dashboardScale = useTransform(scrollYProgress, [0, 0.4], [1, 0.97]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <section
      id="top"
      className="relative min-h-[100dvh] overflow-hidden pt-[4.5rem]"
    >
      <div
        className="pointer-events-none fixed z-30 h-[min(45vw,380px)] w-[min(45vw,380px)] rounded-full bg-sky-600/10 blur-[120px]"
        style={{ left: mouse.x - 190, top: mouse.y - 190 }}
        aria-hidden
      />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_70%_at_50%_-20%,rgba(59,130,246,0.14),transparent_55%)]" />
        <div className="surface-grid absolute inset-0 opacity-[0.45]" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl gap-16 px-5 pb-32 pt-10 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:pb-40 lg:pt-14">
        <motion.div style={{ y: titleY }} className="max-w-xl lg:max-w-none">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="font-display text-[11px] font-medium uppercase tracking-[0.38em] text-sky-200/65">
              Diazites AI
            </p>

            <h1 className="font-display mt-8 text-balance text-[2.65rem] font-light leading-[1.08] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-[3.75rem] xl:text-[4rem]">
              Hire AI agents that work for your business{" "}
              <span className="text-white/95">24/7</span>
            </h1>

            <p className="mt-10 max-w-xl text-lg leading-[1.65] text-white/55 md:text-xl">
              AI agents that run your business 24/7—handling calls, texts, follow-ups,
              booking appointments, qualifying leads, updating your CRM, managing ads,
              posting content, sending reminders, and closing opportunities
              automatically.
            </p>

            <div className="mt-12 flex flex-wrap items-center gap-6">
              <motion.a
                href="#pricing"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.99 }}
                className="inline-flex items-center gap-2 rounded-sm border border-white/25 bg-white px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-black transition hover:bg-white/95"
              >
                Hire your first agent
                <ArrowRight className="size-4" />
              </motion.a>
              <button
                type="button"
                onClick={scrollToMissionVideo}
                className="inline-flex items-center gap-2 rounded-sm border border-white/15 bg-transparent px-8 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-white/90 transition hover:border-white/30 hover:bg-white/[0.04]"
              >
                <Play className="size-4 fill-current" />
                Watch demo
              </button>
            </div>

            <motion.a
              href="#what-we-do"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-12 inline-flex items-center gap-2 text-sm font-medium text-sky-300/85 underline-offset-4 transition hover:text-white"
            >
              Explore the platform
              <ArrowRight className="size-4" />
            </motion.a>
          </motion.div>
        </motion.div>

        <motion.div
          style={{ scale: dashboardScale }}
          className="relative mx-auto w-full max-w-lg lg:max-w-none"
        >
          <div className="pointer-events-none absolute -inset-8 rounded-[2rem] bg-gradient-to-br from-sky-600/15 via-transparent to-indigo-600/15 blur-3xl" />

          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.09] bg-[#070b14]/70 p-5 shadow-[0_40px_100px_-50px_rgba(15,23,42,0.85)] backdrop-blur-2xl">
            <div className="mb-5 flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-400/90" />
                <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/40">
                  Live operations
                </span>
              </div>
              <span className="rounded-sm border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400/95">
                Online
              </span>
            </div>

            <div className="space-y-2.5">
              {feedItems.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + i * 0.12, duration: 0.45 }}
                  className={`flex items-center justify-between rounded-xl border border-white/[0.05] bg-gradient-to-r ${item.tone} px-4 py-3`}
                >
                  <span className="text-sm font-medium text-white/90">{item.label}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-white/45">
                    Live
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Teaser → full film below (BioAstra-style primary video lives on page, not embedded twice) */}
            <button
              type="button"
              onClick={scrollToMissionVideo}
              className="group relative mt-6 aspect-video w-full overflow-hidden rounded-xl border border-white/[0.08] text-left"
            >
              <div
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(56,189,248,0.12),_transparent_65%),linear-gradient(145deg,_rgba(15,23,42,0.95)_0%,_rgba(15,23,42,0.7)_100%)]"
                aria-hidden
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6">
                <span className="flex size-16 items-center justify-center rounded-full border border-white/25 bg-white/[0.08] shadow-[0_0_40px_-12px_rgba(56,189,248,0.35)] backdrop-blur-md transition group-hover:scale-105 group-hover:border-white/40">
                  <Play className="size-7 fill-white text-white" aria-hidden />
                </span>
                <span className="font-display text-xs font-medium uppercase tracking-[0.35em] text-white/75">
                  Watch the film
                </span>
              </div>
            </button>
          </div>
        </motion.div>
      </div>

      <motion.a
        href="#mission-video"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.45em] text-white/35 transition hover:text-white/55"
      >
        Scroll down
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        >
          <ChevronDown className="size-5 opacity-70" />
        </motion.span>
      </motion.a>
    </section>
  );
}
