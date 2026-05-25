"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  DEFAULT_HERO_VIDEO_MP4,
  HERO_BACKGROUND_VIDEO_URL,
} from "@/lib/marketing-video";

const FALLBACK_MP4 = DEFAULT_HERO_VIDEO_MP4;

/**
 * Full-bleed muted loop behind the marketing hero.
 * Uses play() on mount and falls back if the env URL is invalid (e.g. dead Coverr link).
 */
export function HeroBackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState(HERO_BACKGROUND_VIDEO_URL);
  const [failed, setFailed] = useState(false);

  const tryPlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    void el.play().catch(() => {
      /* autoplay blocked — still show first frame */
    });
  }, []);

  useEffect(() => {
    tryPlay();
  }, [src, tryPlay]);

  function handleError() {
    if (src !== FALLBACK_MP4) {
      setSrc(FALLBACK_MP4);
      return;
    }
    setFailed(true);
  }

  if (failed) {
    return (
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(139,92,246,0.35),transparent_60%)]" />
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-violet-950/40 via-background to-cyan-950/30" />
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <video
        ref={videoRef}
        key={src}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full min-h-[480px] scale-105 object-cover opacity-[0.55] dark:opacity-[0.62]"
        src={src}
        onLoadedData={tryPlay}
        onError={handleError}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/55 via-background/35 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(139,92,246,0.22),transparent_55%)]" />
    </div>
  );
}
