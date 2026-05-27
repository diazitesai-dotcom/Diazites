import type { LandingSection } from "@/types/marketing-os";

export function buildPublicConfigFromVersion(
  page: Record<string, unknown>,
  version: Record<string, unknown>,
): Record<string, unknown> {
  const sections = (version.sections as LandingSection[] | undefined) ?? [];
  const hero = sections.find((s) => s.type === "hero" && s.enabled);
  const offer = sections.find((s) => s.type === "offer" && s.enabled);
  const benefits = sections.find((s) => s.type === "benefits" && s.enabled);

  const bullets =
    (benefits?.content?.items as string[] | undefined)?.filter(Boolean) ?? [];

  return {
    asset: {
      headline: String(hero?.content?.headline ?? page.headline ?? ""),
      subheadline: String(hero?.content?.subheadline ?? page.subheadline ?? ""),
      primaryCta: String(hero?.content?.cta ?? page.cta_text ?? "Get Started"),
      bullets,
      socialProof: String(offer?.content?.body ?? page.offer ?? ""),
    },
    formFields: version.form_fields ?? [],
    sections,
  };
}
