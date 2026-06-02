import type { NicheId, NicheProvisionInput } from "@/lib/niche/types";

function haystack(input: NicheProvisionInput): string {
  return [input.industry, input.businessType, input.services, input.businessName]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function matches(text: string, patterns: string[]): boolean {
  return patterns.some((p) => text.includes(p));
}

export function detectNiche(input: NicheProvisionInput): {
  nicheId: NicheId;
  displayName: string;
} {
  const text = haystack(input);

  if (matches(text, ["real estate", "realtor", "broker", "property", "mls", "listing"])) {
    return { nicheId: "real_estate", displayName: "Real Estate" };
  }
  if (
    matches(text, [
      "restaurant",
      "cafe",
      "catering",
      "food service",
      "hospitality",
      "dining",
      "bistro",
    ])
  ) {
    return { nicheId: "restaurant", displayName: "Restaurant" };
  }
  if (
    matches(text, [
      "med spa",
      "medspa",
      "aesthetic",
      "cosmetic",
      "botox",
      "wellness clinic",
      "skin care",
      "skincare",
    ])
  ) {
    return { nicheId: "med_spa", displayName: "Med Spa" };
  }
  if (matches(text, ["law firm", "attorney", "legal", "lawyer", "litigation", "paralegal"])) {
    return { nicheId: "law_firm", displayName: "Law Firm" };
  }
  if (
    matches(text, ["nonprofit", "non-profit", "charity", "foundation", "donor", "501c", "ngo"])
  ) {
    return { nicheId: "nonprofit", displayName: "Nonprofit" };
  }
  if (
    matches(text, [
      "hvac",
      "plumbing",
      "roofing",
      "home service",
      "contractor",
      "electrician",
      "landscaping",
      "pest control",
    ])
  ) {
    return { nicheId: "home_services", displayName: "Home Services" };
  }
  if (
    matches(text, [
      "marketing agency",
      "digital agency",
      "advertising agency",
      "media agency",
      "seo agency",
      "ppc agency",
    ]) ||
    text.includes("agency")
  ) {
    return { nicheId: "marketing_agency", displayName: "Marketing Agency" };
  }

  return { nicheId: "generic", displayName: "General Business" };
}
