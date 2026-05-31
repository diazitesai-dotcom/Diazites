import type { PlatformAgentId } from "@/types/platform-growth";

export type LiveAgentCard = {
  id: PlatformAgentId;
  name: string;
  status: "running" | "active" | "processing" | "inactive";
  lastAction: string;
  metric: string;
};

/** Default live status cards for Mission Control — merged with DB agent state in UI. */
export const DEFAULT_LIVE_AGENT_CARDS: LiveAgentCard[] = [
  {
    id: "landing_page",
    name: "Landing Page Agent",
    status: "running",
    lastAction: "Created new page version",
    metric: "8.3% CVR",
  },
  {
    id: "ads",
    name: "Ads Agent",
    status: "active",
    lastAction: "Optimized Google campaign",
    metric: "$18 CPL",
  },
  {
    id: "lead_management",
    name: "Lead Agent",
    status: "running",
    lastAction: "Scored 3 new leads",
    metric: "12 hot leads",
  },
  {
    id: "email",
    name: "Email Agent",
    status: "active",
    lastAction: "Sent nurture email",
    metric: "31% open rate",
  },
  {
    id: "optimization",
    name: "Optimization Agent",
    status: "processing",
    lastAction: "Recommended budget shift",
    metric: "14% improved CVR",
  },
];
