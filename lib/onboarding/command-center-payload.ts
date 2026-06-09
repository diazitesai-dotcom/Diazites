/** Serializable onboarding state passed to launch. */

export type OnboardingLandingDraft = {
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

export type OnboardingLandingSettings = {
  ctaType: "call" | "form" | "booking" | "checkout";
  buttonText: string;
  pageSlug: string;
  trackingEvent: string;
  thankYouRedirect: string;
  brandTone: string;
};

export type OnboardingPipelineAutomation = {
  id: string;
  label: string;
  enabled: boolean;
};

export type OnboardingPipelineWorkflow = {
  pipelineType: string;
  leadOwner: string;
  responseSpeed: string;
  followUpStyle: string;
  followUpChannels: string[];
  qualificationQuestions: string;
  bookingAction: string;
  lostLeadRule: string;
  stages: string[];
  automations: OnboardingPipelineAutomation[];
  followUpMessages: {
    firstSms: string;
    firstEmail: string;
    voicemailScript: string;
    followUpEmail: string;
    finalReminder: string;
  };
};

export type CommandCenterLaunchPayload = {
  landingTemplateId: string;
  landingDraft: OnboardingLandingDraft;
  landingSettings: OnboardingLandingSettings;
  logoUrl?: string | null;
  pipelineWorkflow: OnboardingPipelineWorkflow;
  zernioApiKey?: string | null;
  pipelineTestPassed: boolean;
};
