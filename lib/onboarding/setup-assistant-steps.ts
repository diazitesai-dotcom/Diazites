import type { OnboardingChecklistKey } from "@/lib/onboarding/draft";

export type SetupStepPrompt = {
  /** Conversational prompt sent to the operator when the client picks this step. */
  prompt: string;
  /** Short label for the quick-step chip. */
  cta: string;
};

/** Maps each post-setup checklist item to a guided setup prompt for the assistant. */
export const SETUP_STEP_PROMPTS: Record<OnboardingChecklistKey, SetupStepPrompt> = {
  profile_complete: {
    prompt: "Help me finish my business profile.",
    cta: "Finish profile",
  },
  integrations_connected: {
    prompt:
      "Help me connect my ad and CRM integrations. I want to connect Zernio, Meta, or Google so my agents can run paid campaigns.",
    cta: "Connect integrations",
  },
  agents_assigned: {
    prompt:
      "Activate my first AI agent stack. Recommend which agents to turn on for my business and set them up.",
    cta: "Activate agents",
  },
  landing_page_ready: {
    prompt:
      "Generate and publish a high-converting landing page for my business so I can capture leads.",
    cta: "Build landing page",
  },
  campaign_built: {
    prompt:
      "Draft a lead-generation campaign for me using my connected ad platforms and budget.",
    cta: "Create campaign",
  },
  ai_active: {
    prompt:
      "Enable AI follow-up automation so new leads get contacted instantly. Set up the follow-up sequence.",
    cta: "Enable follow-up",
  },
  team_invited: {
    prompt: "Help me invite my team and assign seats under Organization.",
    cta: "Invite team",
  },
};

/** Single comprehensive prompt for the autonomous "set everything up" flow. */
export function buildAutonomousSetupPrompt(remainingKeys: OnboardingChecklistKey[]): string {
  const tasks = remainingKeys
    .filter((k) => k !== "profile_complete")
    .map((k) => SETUP_STEP_PROMPTS[k]?.cta)
    .filter(Boolean);

  return [
    "Set everything up for me end to end. Act as my growth setup specialist and walk me through completing my launch.",
    tasks.length
      ? `Remaining steps to complete: ${tasks.join(", ")}.`
      : "Review my setup and confirm everything is launch-ready.",
    "For each step, tell me exactly what you're doing, give me the one-click action to run it, and flag anything that needs my input (like connecting an ad account or approving spend).",
  ].join(" ");
}
