"use client";

import { useMemo, useState } from "react";

import {
  DEFAULT_HERO_VIDEO_MP4,
  HERO_BACKGROUND_VIDEO_URL,
  parseYoutubeVideoId,
  resolveHeroYoutubeId,
  youtubeEmbedUrl,
} from "@/lib/marketing-video";

/**
 * Full-bleed hero background — YouTube embed (muted, looped) or MP4 when env is a direct file.
 */
export function HeroBackgroundVideo() {
  const youtubeId = useMemo(() => resolveHeroYoutubeId(), []);
  const mp4FromEnv = useMemo(() => {
    const url = HERO_BACKGROUND_VIDEO_URL.trim();
    if (!url || parseYoutubeVideoId(url)) return null;
    return url;
  }, []);

  const [useMp4Fallback, setUseMp4Fallback] = useState(false);
  const mp4Src = mp4FromEnv ?? DEFAULT_HERO_VIDEO_MP4;

  const embedSrc = useMemo(
    () => youtubeEmbedUrl(youtubeId, { background: true }),
    [youtubeId],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {!useMp4Fallback ? (
        <div className="absolute inset-0 opacity-[0.58] dark:opacity-[0.65]">
          <iframe
            title="Homepage hero background"
            src={embedSrc}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            className="absolute left-1/2 top-1/2 h-[120%] w-[300%] max-w-none -translate-x-1/2 -translate-y-1/2 border-0"
            style={{ minWidth: "100vw", minHeight: "100%" }}
            onError={() => setUseMp4Fallback(true)}
          />
        </div>
      ) : (
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full min-h-[480px] scale-105 object-cover opacity-[0.55] dark:opacity-[0.62]"
          src={mp4Src}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-background/55 via-background/35 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(139,92,246,0.22),transparent_55%)]" />
    </div>
  );
}
