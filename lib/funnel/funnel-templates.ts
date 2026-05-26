import type { LandingSection } from "@/types/marketing-os";
import { DEFAULT_LANDING_SECTIONS } from "@/types/marketing-os";

export type FunnelTemplate = {
  id: string;
  name: string;
  industry: string;
  description: string;
  conversionScore: number;
  pagesIncluded: string[];
  headline: string;
  subheadline: string;
  offer: string;
  location: string;
  ctaText: string;
  sections: LandingSection[];
};

function withContent(
  base: LandingSection[],
  patch: Partial<Record<LandingSection["type"], Record<string, unknown>>>,
): LandingSection[] {
  return base.map((section) => ({
    ...section,
    content: { ...section.content, ...(patch[section.type] ?? {}) },
  }));
}

export const FUNNEL_TEMPLATES: FunnelTemplate[] = [
  {
    id: "roofing-leads",
    name: "Roofing Lead Gen",
    industry: "Home Services",
    description: "Storm damage inspection funnel with quote form and trust badges.",
    conversionScore: 87,
    pagesIncluded: ["Landing", "Thank You"],
    headline: "Free Storm Damage Roof Check — Done in 60 Seconds",
    subheadline: "Licensed, insured, and trusted by 500+ homeowners in your area.",
    offer: "Free inspection + same-day written estimate. No obligation.",
    location: "Tampa Bay Area",
    ctaText: "Get My Free Inspection",
    sections: withContent(structuredClone(DEFAULT_LANDING_SECTIONS), {
      hero: {
        headline: "Free Storm Damage Roof Check — Done in 60 Seconds",
        subheadline: "Licensed, insured, and trusted by 500+ homeowners in your area.",
        cta: "Get My Free Inspection",
      },
      offer: {
        title: "What's Included",
        body: "Full roof inspection, photo report, insurance-ready documentation, and same-day quote.",
      },
      benefits: {
        items: ["Licensed & insured", "Same-day estimates", "Insurance claim support", "5-star local reviews"],
      },
    }),
  },
  {
    id: "dentist-booking",
    name: "Dentist Appointment",
    industry: "Medical",
    description: "New patient booking page with services, FAQ, and calendar CTA.",
    conversionScore: 82,
    pagesIncluded: ["Landing", "Booking", "Thank You"],
    headline: "New Patient Special — Exam + X-Ray for $99",
    subheadline: "Gentle care, modern technology, same-week appointments available.",
    offer: "Includes comprehensive exam, digital x-rays, and personalized treatment plan.",
    location: "Orlando, FL",
    ctaText: "Book My Appointment",
    sections: withContent(structuredClone(DEFAULT_LANDING_SECTIONS), {
      hero: {
        headline: "New Patient Special — Exam + X-Ray for $99",
        subheadline: "Gentle care, modern technology, same-week appointments available.",
        cta: "Book My Appointment",
      },
      offer: {
        title: "Your First Visit",
        body: "Comprehensive exam, digital x-rays, and a personalized treatment plan — all in one visit.",
      },
      benefits: {
        items: ["Same-week appointments", "Insurance accepted", "Family-friendly team", "Evening hours"],
      },
    }),
  },
  {
    id: "agency-funnel",
    name: "Agency Lead Funnel",
    industry: "Agency",
    description: "High-converting agency landing page with case studies and application form.",
    conversionScore: 79,
    pagesIncluded: ["Landing", "Application", "Thank You"],
    headline: "Scale Your Business With AI-Powered Marketing",
    subheadline: "We build funnels, ads, and follow-up systems that convert.",
    offer: "Free growth audit + 90-day roadmap for qualified businesses.",
    location: "United States",
    ctaText: "Apply for Free Audit",
    sections: withContent(structuredClone(DEFAULT_LANDING_SECTIONS), {
      hero: {
        headline: "Scale Your Business With AI-Powered Marketing",
        subheadline: "We build funnels, ads, and follow-up systems that convert.",
        cta: "Apply for Free Audit",
      },
      offer: {
        title: "Growth Audit Includes",
        body: "Funnel review, ad account audit, CRM pipeline analysis, and a 90-day action plan.",
      },
      benefits: {
        items: ["Done-for-you funnels", "Paid ads management", "AI follow-up", "Weekly reporting"],
      },
    }),
  },
  {
    id: "nonprofit-donate",
    name: "Nonprofit Donation",
    industry: "Nonprofit",
    description: "Donation landing page with impact story and recurring gift CTA.",
    conversionScore: 74,
    pagesIncluded: ["Landing", "Donate", "Thank You"],
    headline: "Help Us Change Lives in Our Community",
    subheadline: "Every dollar goes directly to programs that matter.",
    offer: "Monthly giving starts at $25 — tax deductible.",
    location: "Your Community",
    ctaText: "Donate Now",
    sections: withContent(structuredClone(DEFAULT_LANDING_SECTIONS), {
      hero: {
        headline: "Help Us Change Lives in Our Community",
        subheadline: "Every dollar goes directly to programs that matter.",
        cta: "Donate Now",
      },
      offer: {
        title: "Your Impact",
        body: "$25 feeds a family. $100 funds job training. $500 sponsors a full program month.",
      },
      benefits: {
        items: ["100% program impact", "Tax deductible", "Transparent reporting", "Local volunteers"],
      },
    }),
  },
];
