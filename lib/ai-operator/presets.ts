import type { OperatorPreset } from "@/types/ai-operator";

export const OPERATOR_PRESETS: OperatorPreset[] = [
  { id: "review-plan", label: "Review growth plan", description: "Audit stack & outcomes", prompt: "Review my growth plan" },
  { id: "deploy-stack", label: "Deploy lead stack", description: "Landing → qualify → follow-up", prompt: "Deploy a lead stack" },
  { id: "pixel", label: "Explain pixel failure", description: "Tracking & validation", prompt: "Explain pixel validation failure" },
  { id: "qual-bottleneck", label: "Diagnose qualification", description: "Queue & scoring", prompt: "Diagnose qualification bottleneck" },
  { id: "perf-drop", label: "Explain performance drop", description: "Funnel & velocity", prompt: "Why is performance dropping?" },
  { id: "retargeting", label: "Launch retargeting", description: "Recover warm traffic", prompt: "Launch retargeting" },
  { id: "revenue", label: "Review revenue attribution", description: "Sources & ROAS", prompt: "Review revenue attribution" },
  { id: "meta", label: "Connect Meta Ads", description: "OAuth & accounts", prompt: "Connect my Meta Ads account" },
  { id: "tracking", label: "Fix tracking", description: "Pixel & events", prompt: "How do I fix tracking?" },
  { id: "campaigns", label: "Open campaign workspace", description: "Live campaign ops", prompt: "Take me to live campaigns" },
  { id: "approvals", label: "Show approval queue", description: "Pending decisions", prompt: "Show approval queue" },
  { id: "followup-audit", label: "Audit follow-up system", description: "Sequences & SLA", prompt: "Audit follow-up system" },
];
