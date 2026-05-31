import type { EngineStep } from "@/repositories/engine.repository";

/** Shared engine step metadata — safe to import from client components. */
export const ENGINE_STEPS: ReadonlyArray<{
  key: EngineStep;
  index: number;
  title: string;
  subtitle: string;
  description: string;
}> = [
  {
    key: "input",
    index: 1,
    title: "Input",
    subtitle: "User enters business information",
    description:
      "Website URL, niche, goal/offer, target audience, location, budget, and traffic source.",
  },
  {
    key: "research",
    index: 2,
    title: "AI Research Engine",
    subtitle: "AI analyzes everything automatically",
    description:
      "Website analysis, competitor research, market insights, buyer psychology, pain points, offer opportunities, keywords & angles.",
  },
  {
    key: "strategy",
    index: 3,
    title: "Campaign Creative",
    subtitle: "AI creates a complete marketing strategy",
    description:
      "Positioning, offer strategy, CTA strategy, funnel strategy, traffic strategy, success metrics.",
  },
  {
    key: "funnel",
    index: 4,
    title: "Funnel Blueprint",
    subtitle: "AI builds the full funnel structure",
    description: "Ad/traffic, landing page, lead capture, thank-you page, follow-up system.",
  },
  {
    key: "generation",
    index: 5,
    title: "AI Generation Suite",
    subtitle: "AI generates all assets",
    description:
      "Landing pages, ad images & copy, email sequences, hooks & headlines, offers & lead magnets, social proof & trust, FAQ & objections.",
  },
  {
    key: "variants",
    index: 6,
    title: "Variant Engine",
    subtitle: "AI creates multiple high-converting variants",
    description: "Variant A, B, C, and D across every asset kind.",
  },
  {
    key: "scoring",
    index: 7,
    title: "AI Scoring Engine",
    subtitle: "AI scores & selects the best performer",
    description:
      "Clarity, trust, emotional impact, CTA strength, mobile UX, conversion potential. Winner is auto-selected.",
  },
  {
    key: "launch",
    index: 8,
    title: "Launch System",
    subtitle: "One click — publish landing page + tracking",
    description:
      "Publishes the winning landing page, runs QA, sets UTM + conversion pixels, and goes live in a single step.",
  },
];

export function isLaunchReadyStep(step: EngineStep): boolean {
  return step === "scoring" || step === "launch";
}

export const ENGINE_STEP_KEYS = ENGINE_STEPS.map((s) => s.key);

export function stepIndex(step: EngineStep): number {
  return ENGINE_STEP_KEYS.indexOf(step);
}

export function labelForEngineStep(step: EngineStep): string {
  return ENGINE_STEPS.find((s) => s.key === step)?.title ?? step;
}
