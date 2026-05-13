import type { PipelineStatus } from "@/types/domain";

/**
 * Pure heuristic lead score 0–100. No external calls — this runs on every
 * board fetch and is fast.
 *
 * The score combines:
 *   - contact completeness (email + phone present)
 *   - pipeline stage (booked/won lifts; lost penalizes)
 *   - source quality (landing page > web > manual)
 *   - recency (newer leads score higher; 14-day decay)
 *   - intent signals (timeline urgency, notes filled out, roofing need stated)
 */
export type LeadScoreInput = {
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  status?: PipelineStatus | null;
  timeline?: string | null;
  roofingNeed?: string | null;
  notes?: string | null;
  createdAt?: string | null;
};

export type LeadScoreBucket = "cold" | "warm" | "hot" | "qualified";

export type LeadScore = {
  value: number;
  bucket: LeadScoreBucket;
};

export function scoreLead(input: LeadScoreInput): LeadScore {
  let score = 0;

  // Contact completeness
  if (input.email && input.email.includes("@")) score += 18;
  if (input.phone && input.phone.replace(/\D/g, "").length >= 7) score += 18;

  // Source quality
  const source = (input.source ?? "").toLowerCase();
  if (source.startsWith("landing:")) score += 16;
  else if (source === "web" || source === "form") score += 10;
  else if (source === "manual" || source === "import") score += 4;
  else score += 6;

  // Pipeline stage
  switch (input.status) {
    case "new":
      score += 6;
      break;
    case "contacted":
      score += 12;
      break;
    case "qualified":
      score += 22;
      break;
    case "booked":
      score += 30;
      break;
    case "won":
      score += 35;
      break;
    case "lost":
      score -= 25;
      break;
    default:
      break;
  }

  // Intent signals
  const timeline = (input.timeline ?? "").toLowerCase();
  if (timeline.includes("immediate") || timeline.includes("asap") || timeline.includes("urgent")) {
    score += 12;
  } else if (timeline.includes("month") || timeline.includes("week")) {
    score += 8;
  } else if (timeline.length > 0) {
    score += 3;
  }

  if (input.notes && input.notes.trim().length > 20) score += 4;
  if (input.roofingNeed && input.roofingNeed.trim().length > 0) score += 4;

  // Recency decay (14 day half-life)
  if (input.createdAt) {
    const ageMs = Date.now() - new Date(input.createdAt).getTime();
    const ageDays = ageMs / (24 * 3600 * 1000);
    const recencyBonus = Math.max(0, 14 - ageDays);
    score += Math.round(recencyBonus * 0.5);
  }

  // Clamp 0–100
  const value = Math.max(0, Math.min(100, Math.round(score)));

  let bucket: LeadScoreBucket;
  if (value >= 75) bucket = "qualified";
  else if (value >= 55) bucket = "hot";
  else if (value >= 30) bucket = "warm";
  else bucket = "cold";

  return { value, bucket };
}

export function bucketLabel(bucket: LeadScoreBucket): string {
  switch (bucket) {
    case "qualified":
      return "Qualified";
    case "hot":
      return "Hot";
    case "warm":
      return "Warm";
    case "cold":
      return "Cold";
  }
}

export function bucketClasses(bucket: LeadScoreBucket): string {
  switch (bucket) {
    case "qualified":
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
    case "hot":
      return "bg-rose-500/15 text-rose-300 border-rose-500/30";
    case "warm":
      return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    case "cold":
      return "bg-slate-500/15 text-slate-300 border-slate-500/30";
  }
}
