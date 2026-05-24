"use client";

import { motion } from "framer-motion";

import { MARKETING_VIDEO_ID } from "@/lib/marketing-video";

/**
 * Full-bleed film strip similar to editorial mission sites (e.g. bioastra.org):
 * wide canvas, edge-to-edge embed, soft gradients into page chrome.
 */
export function CinematicVideo() {
  const src = `https://www.youtube.com/embed/${MARKETING_VIDEO_ID}?rel=0&modestbranding=1&playsinline=1`;

  return (
    <section
      id="mission-video"
      className="relative scroll-mt-24 border-y border-white/[0.06] bg-[#030508]"
      aria-labelledby="mission-video-heading"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-[#050810] to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-32 bg-gradient-to-t from-[#050810] to-transparent" />

      <div className="relative mx-auto max-w-[1920px] px-0">
        <div className="flex flex-col gap-6 px-5 pb-8 pt-10 sm:px-8 md:flex-row md:items-end md:justify-between md:pb-10 md:pt-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            <p className="font-display text-[11px] font-medium uppercase tracking-[0.38em] text-sky-200/55">
              Film
            </p>
            <h2
              id="mission-video-heading"
              className="font-display mt-3 max-w-xl text-2xl font-light tracking-tight text-white md:text-3xl"
            >
              See Diazites AI at work in your business
            </h2>
          </motion.div>
          <motion.a
            href="#what-we-do"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="shrink-0 text-sm font-medium text-sky-300/85 underline-offset-4 transition hover:text-white md:pb-1"
          >
            Continue to what we do →
          </motion.a>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.985 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="relative aspect-video w-full overflow-hidden shadow-[0_40px_120px_-60px_rgba(15,23,42,0.9)]"
        >
          <iframe
            title="Diazites AI — mission film"
            src={src}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 size-full border-0"
          />
        </motion.div>

      </div>
    </section>
  );
}
