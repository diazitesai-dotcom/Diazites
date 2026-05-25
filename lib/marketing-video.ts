/** Default homepage film — swap for your production asset (YouTube ID). */
export const MARKETING_VIDEO_ID = "dQw4w9WgXcQ";

/** Verified direct MP4 (Coverr CDN often returns HTML, not video). */
export const DEFAULT_HERO_VIDEO_MP4 =
  "https://videos.pexels.com/video-files/3195394/3195394-uhd_2560_1440_25fps.mp4";

/** Full-bleed hero background loop. Override with NEXT_PUBLIC_HERO_VIDEO_URL. */
export const HERO_BACKGROUND_VIDEO_URL =
  process.env.NEXT_PUBLIC_HERO_VIDEO_URL ?? DEFAULT_HERO_VIDEO_MP4;
