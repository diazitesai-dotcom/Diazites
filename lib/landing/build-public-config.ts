import type { LandingSection } from "@/types/marketing-os";

export type PublicLandingAsset = {
  headline?: string;
  subheadline?: string;
  bullets?: string[];
  primaryCta?: string;
  socialProof?: string;
  heroImageBrief?: string;
  brandName?: string;
  heroImageUrl?: string;
  videoEmbedUrl?: string;
  theme?: string;
  /** Layout/design variant — controls structure, not just color. */
  design?: string;
  stats?: Array<{ value: string; label: string }>;
  gallery?: Array<{ url: string; alt: string }>;
  testimonials?: Array<{ quote: string; author: string; role: string }>;
  faqs?: Array<{ question: string; answer: string }>;
};

export function buildPublicConfigFromVersion(
  page: Record<string, unknown>,
  version: Record<string, unknown>,
): Record<string, unknown> {
  const sections = (version.sections as LandingSection[] | undefined) ?? [];
  const hero = sections.find((s) => s.type === "hero" && s.enabled);
  const offer = sections.find((s) => s.type === "offer" && s.enabled);
  const benefits = sections.find((s) => s.type === "benefits" && s.enabled);
  const video = sections.find((s) => s.type === "video" && s.enabled);
  const gallery = sections.find((s) => s.type === "gallery" && s.enabled);
  const testimonials = sections.find((s) => s.type === "testimonials" && s.enabled);
  const faq = sections.find((s) => s.type === "faq" && s.enabled);

  const bullets =
    (benefits?.content?.items as string[] | undefined)?.filter(Boolean) ?? [];

  const asset: PublicLandingAsset = {
    brandName: String(hero?.content?.brandName ?? page.audience ?? "").trim() || undefined,
    headline: String(hero?.content?.headline ?? page.headline ?? ""),
    subheadline: String(hero?.content?.subheadline ?? page.subheadline ?? ""),
    primaryCta: String(hero?.content?.cta ?? page.cta_text ?? "Get Started"),
    bullets,
    socialProof: String(offer?.content?.body ?? page.offer ?? ""),
    heroImageUrl: hero?.content?.heroImageUrl ? String(hero.content.heroImageUrl) : undefined,
    videoEmbedUrl: video?.content?.embedUrl ? String(video.content.embedUrl) : undefined,
    theme: hero?.content?.theme ? String(hero.content.theme) : "violet",
    design: hero?.content?.design ? String(hero.content.design) : undefined,
    stats: (hero?.content?.stats as PublicLandingAsset["stats"]) ?? [],
    gallery: (gallery?.content?.images as PublicLandingAsset["gallery"]) ?? [],
    testimonials: (testimonials?.content?.items as PublicLandingAsset["testimonials"]) ?? [],
    faqs: (faq?.content?.items as PublicLandingAsset["faqs"]) ?? [],
  };

  return {
    asset,
    formFields: version.form_fields ?? [],
    sections,
  };
}
