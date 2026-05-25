"use client";

import { HERO_BACKGROUND_VIDEO_URL } from "@/lib/marketing-video";

/**
 * Full-bleed muted loop behind the marketing hero (AI command center aesthetic).
 */
export function HeroBackgroundVideo() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 h-full w-full scale-105 object-cover opacity-[0.35] dark:opacity-[0.42]"
        src={HERO_BACKGROUND_VIDEO_URL}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(139,92,246,0.18),transparent_55%)]" />
    </div>
  );
}
