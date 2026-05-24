import { EVENT_TYPES } from "@/types/backend";
import type { ActivitySeverity } from "@/lib/dashboard/mission-control-types";

export type ActivityFeedCategory = "deployments" | "agents" | "errors" | "ai_actions";

export type ActivityFeedFilter = "all" | ActivityFeedCategory;

export const ACTIVITY_FEED_FILTERS: { id: ActivityFeedFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "deployments", label: "Deployments" },
  { id: "agents", label: "Agents" },
  { id: "errors", label: "Errors" },
  { id: "ai_actions", label: "AI Actions" },
];

const DEPLOYMENT_EVENTS = new Set<string>([
  EVENT_TYPES.CAMPAIGN_CREATED,
  EVENT_TYPES.CAMPAIGN_UPDATED,
  EVENT_TYPES.ENGINE_LAUNCHED,
  EVENT_TYPES.AD_CAMPAIGN_PUSHED,
  EVENT_TYPES.LANDING_PAGE_PUBLISHED,
  EVENT_TYPES.GROWTH_ENGINE_STAGE_CHANGED,
  EVENT_TYPES.ONBOARDING_STAGE_CHANGED,
  EVENT_TYPES.AD_ACCOUNT_CONNECTED,
  EVENT_TYPES.AD_ACCOUNT_SYNCED,
]);

const AGENT_EVENTS = new Set<string>([
  EVENT_TYPES.AGENT_ACTIVATED,
  EVENT_TYPES.AGENT_STATUS_CHANGED,
]);

const AI_EVENTS = new Set<string>([
  EVENT_TYPES.AI_FOLLOW_UP_SENT,
  EVENT_TYPES.OPTIMIZATION_RECOMMENDED,
  EVENT_TYPES.OPTIMIZATION_APPLIED,
  EVENT_TYPES.APPROVAL_REQUESTED,
  EVENT_TYPES.APPROVAL_DECIDED,
]);

const ERROR_EVENTS = new Set<string>([EVENT_TYPES.ENGINE_QA_FAILED]);

export function activityCategory(
  eventType: string,
  severity?: ActivitySeverity,
): ActivityFeedCategory | undefined {
  if (ERROR_EVENTS.has(eventType) || severity === "critical") return "errors";
  if (AGENT_EVENTS.has(eventType)) return "agents";
  if (DEPLOYMENT_EVENTS.has(eventType)) return "deployments";
  if (AI_EVENTS.has(eventType)) return "ai_actions";
  if (/fail|error|rejected/i.test(eventType)) return "errors";
  if (/agent/i.test(eventType)) return "agents";
  if (/deploy|campaign|engine|landing|growth|onboard|ad_account/i.test(eventType)) {
    return "deployments";
  }
  if (/ai|optim|approval|follow.?up/i.test(eventType)) return "ai_actions";
  return undefined;
}

export function inferActivityCategory(item: {
  title: string;
  detail: string;
  severity?: ActivitySeverity;
  category?: ActivityFeedCategory;
}): ActivityFeedCategory | undefined {
  if (item.category) return item.category;
  const haystack = `${item.title} ${item.detail}`.toLowerCase();
  if (item.severity === "critical") return "errors";
  if (/agent|activated|deactivated/.test(haystack)) return "agents";
  if (/deploy|campaign|engine|landing|stack|growth engine|onboard/.test(haystack)) {
    return "deployments";
  }
  if (/fail|error|critical|rejected/.test(haystack)) return "errors";
  if (/ai|optim|follow-up|automation|approval/.test(haystack)) return "ai_actions";
  return undefined;
}
