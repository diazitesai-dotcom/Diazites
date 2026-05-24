import type { AutonomousMode } from "@/types/agent-deployment";

export type AiModeBehavior = {
  label: string;
  summary: string;
  helper: string;
  deployLabel: string;
  note?: string;
};

export const AI_MODE_BEHAVIOR: Record<AutonomousMode, AiModeBehavior> = {
  manual: {
    label: "Manual",
    helper: "User approval required.",
    summary: "You approve every deployment and optimization before anything goes live.",
    deployLabel: "Review & deploy",
  },
  guided: {
    label: "Guided",
    helper: "AI recommends. You approve.",
    summary: "AI proposes stacks and changes — you approve high-impact actions.",
    deployLabel: "Deploy with approval",
    note: "Guided mode: AI will suggest optimizations; nothing launches without your confirmation.",
  },
  autonomous: {
    label: "Autonomous",
    helper: "AI may deploy, optimize, and reroute automatically.",
    summary: "AI may deploy agents, launch optimizations, and apply routing changes automatically.",
    deployLabel: "Auto-deploy enabled",
    note: "Autonomous mode active. AI may deploy agents, launch optimizations, and apply routing changes automatically within guardrails.",
  },
};
