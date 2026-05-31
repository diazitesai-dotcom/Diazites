import type {
  CampaignGoalId,
  CrmPipelineStageId,
  PlatformAgentId,
} from "@/types/platform-growth";

export const CAMPAIGN_GOALS: { id: CampaignGoalId; label: string }[] = [
  { id: "generate_leads", label: "Generate Leads" },
  { id: "book_appointments", label: "Book Appointments" },
  { id: "sell_products", label: "Sell Products" },
  { id: "promote_services", label: "Promote Services" },
  { id: "website_traffic", label: "Increase Website Traffic" },
  { id: "form_submissions", label: "Collect Form Submissions" },
  { id: "grow_email_list", label: "Grow Email List" },
  { id: "retarget_visitors", label: "Retarget Visitors" },
  { id: "local_ads", label: "Launch Local Ads" },
  { id: "scale_campaigns", label: "Scale Existing Campaigns" },
];

export const CRM_PIPELINE_STAGES: {
  id: CrmPipelineStageId;
  label: string;
  mapsToStatus?: string;
}[] = [
  { id: "new_lead", label: "New Lead", mapsToStatus: "new" },
  { id: "contacted", label: "Contacted", mapsToStatus: "contacted" },
  { id: "qualified", label: "Qualified", mapsToStatus: "qualified" },
  { id: "booked", label: "Booked", mapsToStatus: "booked" },
  { id: "proposal_sent", label: "Proposal Sent", mapsToStatus: "contacted" },
  { id: "closed_won", label: "Closed Won", mapsToStatus: "won" },
  { id: "closed_lost", label: "Closed Lost", mapsToStatus: "lost" },
  { id: "nurture", label: "Nurture", mapsToStatus: "contacted" },
];

export const PLATFORM_AI_AGENTS: {
  id: PlatformAgentId;
  name: string;
  description: string;
  deployKey?: string;
}[] = [
  {
    id: "landing_page",
    name: "Landing Page Agent",
    description: "Copy, sections, forms, A/B versions, and conversion tracking",
    deployKey: "landing_page",
  },
  {
    id: "ads",
    name: "Ads Agent",
    description: "Google, Meta, TikTok, YouTube, Bing, LinkedIn, and more — draft campaigns for approval",
    deployKey: "search_ads",
  },
  {
    id: "lead_management",
    name: "Lead Management Agent",
    description: "Capture, score, and route leads through your CRM pipeline",
    deployKey: "lead_qualification",
  },
  {
    id: "email",
    name: "Email Agent",
    description: "Nurture campaigns, reminders, and lead notifications",
    deployKey: "ai_follow_up",
  },
  {
    id: "appointment",
    name: "Appointment Agent",
    description: "Booking links, Google Calendar, and status updates",
  },
  {
    id: "task",
    name: "Task Agent",
    description: "Creates follow-up, call, and approval tasks from lead activity",
  },
  {
    id: "crm",
    name: "CRM Agent",
    description: "Pipeline updates, notes, and external CRM sync",
    deployKey: "lead_qualification",
  },
  {
    id: "optimization",
    name: "Optimization Agent",
    description: "Monitors performance and recommends budget and copy shifts",
  },
  {
    id: "reporting",
    name: "Reporting Agent",
    description: "Daily, weekly, and monthly growth reports",
  },
  {
    id: "creative",
    name: "Creative Agent",
    description: "Ad creatives, hooks, scripts, and social captions",
  },
  {
    id: "strategy",
    name: "Strategy Agent",
    description: "Channel mix, budget allocation, and growth plan",
  },
  {
    id: "chat_assistant",
    name: "AI Chat Assistant",
    description: "Command agents, edit copy, and summarize pipeline health",
  },
];

export const AGENT_PERMISSION_LEVELS = [
  { id: "recommend_only", label: "Recommend Only" },
  { id: "draft_only", label: "Draft Only" },
  { id: "auto_with_approval", label: "Auto-Execute With Approval" },
  { id: "full_auto", label: "Full Auto-Execute" },
] as const;

export const AD_INTEGRATION_PLATFORMS = [
  "Google Ads",
  "Meta Ads",
  "Instagram",
  "Facebook",
  "TikTok Ads",
  "YouTube Ads",
  "Microsoft/Bing Ads",
  "LinkedIn Ads",
  "X Ads",
  "Snapchat Ads",
  "Pinterest Ads",
  "Reddit Ads",
] as const;

export const CORE_USER_FLOW = [
  "User lands on homepage",
  "User creates account or logs in",
  "User completes onboarding wizard",
  "User enters business information",
  "User connects ad accounts and tools",
  "User selects AI agents to activate",
  "AI generates strategy",
  "AI creates landing pages",
  "AI creates ad campaigns",
  "User reviews and approves",
  "Campaigns launch",
  "Leads are captured",
  "AI agents follow up by text/email",
  "Leads move through CRM pipeline",
  "Tasks are created automatically",
  "AI monitors performance",
  "AI optimizes campaigns",
  "Reports are generated",
  "User scales campaigns, locations, offers, and agents",
] as const;
