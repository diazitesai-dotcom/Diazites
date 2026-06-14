export type LandingPageCtaType = "call" | "form" | "booking" | "checkout";

export type LandingPageDraft = {
  heroHeadline: string;
  subheadline: string;
  ctaText: string;
  offerDetails: string;
  benefits: string;
  formFields: string;
  socialProof: string;
  faq: string;
  thankYouMessage: string;
};

export type LandingPageSettings = {
  ctaType: LandingPageCtaType;
  buttonText: string;
  pageSlug: string;
  trackingEvent: string;
  thankYouRedirect: string;
  brandTone: string;
};
