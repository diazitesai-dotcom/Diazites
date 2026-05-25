/** Homepage film section + hero background (YouTube). */
export const MARKETING_VIDEO_ID = "Fyo6vnM8BBk";

/** Default hero background — https://youtu.be/Fyo6vnM8BBk */
export const DEFAULT_HERO_YOUTUBE_ID = "Fyo6vnM8BBk";

/** MP4 fallback if YouTube is blocked or env points to a direct file. */
export const DEFAULT_HERO_VIDEO_MP4 =
  "https://videos.pexels.com/video-files/3195394/3195394-uhd_2560_1440_25fps.mp4";

/** Optional: full YouTube URL or youtu.be link (parsed for ID). */
export const HERO_BACKGROUND_VIDEO_URL = process.env.NEXT_PUBLIC_HERO_VIDEO_URL ?? "";

export function parseYoutubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    if (url.hostname === "youtu.be") {
      const id = url.pathname.replace(/^\//, "").split("/")[0];
      return id.length === 11 ? id : null;
    }
    if (url.hostname.includes("youtube.com")) {
      const v = url.searchParams.get("v");
      if (v && v.length === 11) return v;
      const embed = url.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
      if (embed) return embed[1];
    }
  } catch {
    return null;
  }
  return null;
}

/** Resolves hero background YouTube ID from env or default. */
export function resolveHeroYoutubeId(): string {
  const explicit = process.env.NEXT_PUBLIC_HERO_YOUTUBE_ID?.trim();
  if (explicit) {
    const parsed = parseYoutubeVideoId(explicit);
    return parsed ?? explicit;
  }
  if (HERO_BACKGROUND_VIDEO_URL) {
    const fromUrl = parseYoutubeVideoId(HERO_BACKGROUND_VIDEO_URL);
    if (fromUrl) return fromUrl;
  }
  return DEFAULT_HERO_YOUTUBE_ID;
}

export function youtubeEmbedUrl(
  videoId: string,
  opts?: { autoplay?: boolean; background?: boolean },
): string {
  const autoplay = opts?.autoplay !== false;
  const background = opts?.background !== false;
  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    mute: "1",
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
    iv_load_policy: "3",
  });
  if (background) {
    params.set("controls", "0");
    params.set("disablekb", "1");
    params.set("fs", "0");
    params.set("loop", "1");
    params.set("playlist", videoId);
    params.set("showinfo", "0");
  }
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}
