import type { AgentType } from "@/types/domain";
import { EVENT_TYPES } from "@/types/backend";

export type AgentPlaybookRule = {
  name: string;
  triggerEvent: string;
  actionType: "webhook";
  actionConfig: Record<string, unknown>;
  enabled: boolean;
};

export type AgentPlaybook = {
  description: string;
  rules: AgentPlaybookRule[];
};

export const AGENT_PLAYBOOKS: Record<AgentType, AgentPlaybook> = {
  social_ads: {
    description:
      "Listens for engine launch and ad campaign events. Connect a Zapier or Zernio webhook URL in Automations to push creative live.",
    rules: [
      {
        name: "Social Ads — on engine launched",
        triggerEvent: EVENT_TYPES.ENGINE_LAUNCHED,
        actionType: "webhook",
        actionConfig: {
          source: "agent:social_ads",
          url: "",
          note: "Add webhook URL in Automations to forward launch payload to Meta/social tools.",
        },
        enabled: false,
      },
      {
        name: "Social Ads — on campaign pushed",
        triggerEvent: EVENT_TYPES.AD_CAMPAIGN_PUSHED,
        actionType: "webhook",
        actionConfig: {
          source: "agent:social_ads",
          url: "",
        },
        enabled: false,
      },
    ],
  },
  search_ads: {
    description: "Prepares Google Search campaign hooks when the engine launches.",
    rules: [
      {
        name: "Search Ads — on engine launched",
        triggerEvent: EVENT_TYPES.ENGINE_LAUNCHED,
        actionType: "webhook",
        actionConfig: { source: "agent:search_ads", url: "" },
        enabled: false,
      },
    ],
  },
  landing_page: {
    description: "Tracks landing page launch events for QA and optimization loops.",
    rules: [
      {
        name: "Landing Page — on engine launched",
        triggerEvent: EVENT_TYPES.ENGINE_LAUNCHED,
        actionType: "webhook",
        actionConfig: { source: "agent:landing_page", url: "" },
        enabled: false,
      },
    ],
  },
  ai_follow_up: {
    description:
      "AI follow-up already runs on every new lead. This agent flags high-intent leads for your team when status changes.",
    rules: [
      {
        name: "AI Follow-Up — on new lead",
        triggerEvent: EVENT_TYPES.LEAD_CREATED,
        actionType: "webhook",
        actionConfig: {
          source: "agent:ai_follow_up",
          url: "",
          note: "Built-in AI email follow-up runs automatically; add a webhook for CRM sync.",
        },
        enabled: false,
      },
    ],
  },
  retargeting: {
    description: "Hooks retargeting audiences when campaigns go live.",
    rules: [
      {
        name: "Retargeting — on engine launched",
        triggerEvent: EVENT_TYPES.ENGINE_LAUNCHED,
        actionType: "webhook",
        actionConfig: { source: "agent:retargeting", url: "" },
        enabled: false,
      },
    ],
  },
  lead_qualification: {
    description: "Notifies your pipeline when a lead moves to qualified or booked.",
    rules: [
      {
        name: "Lead Qualification — status changed",
        triggerEvent: EVENT_TYPES.LEAD_STATUS_CHANGED,
        actionType: "webhook",
        actionConfig: { source: "agent:lead_qualification", url: "" },
        enabled: false,
      },
    ],
  },
};
