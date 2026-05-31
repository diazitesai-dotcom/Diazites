import type { CampaignGoalId } from "@/types/platform-growth";

export type OnboardingAccountIntent = "direct" | "agency" | "sub_account";

export type OnboardingDraft = {
  wizardStep: number;
  accountIntent: OnboardingAccountIntent;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  website: string;
  businessEmail: string;
  businessAddress: string;
  serviceArea: string;
  cityState: string;
  services: string;
  businessHours: string;
  industry: string;
  businessType: string;
  targetAudience: string;
  idealCustomer: string;
  offerPromotion: string;
  monthlyBudget: string;
  campaignGoal: CampaignGoalId;
  brandTone: string;
  brandColors: string;
  existingWebsite: string;
  existingCrm: string;
  leadNotifyEmail: string;
  leadNotifyPhone: string;
  selectedAgents: string[];
  skippedConnections: string[];
};

export type OnboardingChecklistKey =
  | "profile_complete"
  | "integrations_connected"
  | "agents_assigned"
  | "campaign_built"
  | "landing_page_ready"
  | "ai_active"
  | "team_invited";

export type PostSetupChecklistItem = {
  key: OnboardingChecklistKey;
  label: string;
  description: string;
  href: string;
  done: boolean;
};

export function emptyOnboardingDraft(
  overrides?: Partial<OnboardingDraft>,
): OnboardingDraft {
  return {
    wizardStep: 0,
    accountIntent: "direct",
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    website: "",
    businessEmail: "",
    businessAddress: "",
    serviceArea: "",
    cityState: "",
    services: "",
    businessHours: "",
    industry: "",
    businessType: "",
    targetAudience: "",
    idealCustomer: "",
    offerPromotion: "",
    monthlyBudget: "",
    campaignGoal: "generate_leads",
    brandTone: "",
    brandColors: "",
    existingWebsite: "",
    existingCrm: "",
    leadNotifyEmail: "",
    leadNotifyPhone: "",
    selectedAgents: [],
    skippedConnections: [],
    ...overrides,
  };
}

export function draftToWizardPayload(draft: OnboardingDraft) {
  return {
    businessName: draft.businessName,
    ownerName: draft.ownerName,
    email: draft.email,
    phone: draft.phone,
    website: draft.website,
    businessEmail: draft.businessEmail || undefined,
    businessAddress: draft.businessAddress || undefined,
    serviceArea: draft.serviceArea,
    cityState: draft.cityState,
    services: draft.services,
    businessHours: draft.businessHours,
    monthlyBudget: Number(draft.monthlyBudget) || 0,
    industry: draft.industry || undefined,
    businessType:
      draft.accountIntent === "agency"
        ? "agency"
        : draft.businessType || undefined,
    mainServices: draft.services || undefined,
    targetAudience: draft.targetAudience || undefined,
    idealCustomer: draft.idealCustomer || undefined,
    offerPromotion: draft.offerPromotion || undefined,
    campaignGoal: draft.campaignGoal,
    brandTone: draft.brandTone || undefined,
    brandColors: draft.brandColors || undefined,
    existingCrm: draft.existingCrm || undefined,
    existingWebsite: draft.existingWebsite || undefined,
    leadNotifyEmail: draft.leadNotifyEmail || undefined,
    leadNotifyPhone: draft.leadNotifyPhone || undefined,
    accountIntent: draft.accountIntent,
    selectedAgents: draft.selectedAgents,
    skippedConnections: draft.skippedConnections,
  };
}

type OnboardingRow = {
  business_name?: string | null;
  owner_name?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  service_area?: string | null;
  city_state?: string | null;
  services?: string | null;
  business_hours?: string | null;
  monthly_budget?: number | null;
  profile_data?: Record<string, unknown> | null;
};

export function draftFromOnboardingRow(
  row: OnboardingRow | null | undefined,
  defaults?: Partial<OnboardingDraft>,
): OnboardingDraft {
  if (!row) return emptyOnboardingDraft(defaults);

  const pd = (row.profile_data ?? {}) as Record<string, unknown>;

  return emptyOnboardingDraft({
    wizardStep: typeof pd.wizardStep === "number" ? pd.wizardStep : 0,
    accountIntent:
      pd.accountIntent === "agency" || pd.accountIntent === "sub_account"
        ? pd.accountIntent
        : "direct",
    businessName: row.business_name ?? "",
    ownerName: row.owner_name ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    website: row.website ?? "",
    businessEmail: String(pd.businessEmail ?? ""),
    businessAddress: String(pd.businessAddress ?? ""),
    serviceArea: row.service_area ?? "",
    cityState: row.city_state ?? "",
    services: row.services ?? "",
    businessHours: row.business_hours ?? "",
    monthlyBudget:
      row.monthly_budget != null ? String(row.monthly_budget) : "",
    industry: String(pd.industry ?? ""),
    businessType: String(pd.businessType ?? ""),
    targetAudience: String(pd.targetAudience ?? ""),
    idealCustomer: String(pd.idealCustomer ?? ""),
    offerPromotion: String(pd.offerPromotion ?? ""),
    campaignGoal: (pd.campaignGoal as CampaignGoalId) ?? "generate_leads",
    brandTone: String(pd.brandTone ?? ""),
    brandColors: String(pd.brandColors ?? ""),
    existingWebsite: String(pd.existingWebsite ?? ""),
    existingCrm: String(pd.existingCrm ?? ""),
    leadNotifyEmail: String(pd.leadNotifyEmail ?? ""),
    leadNotifyPhone: String(pd.leadNotifyPhone ?? ""),
    selectedAgents: Array.isArray(pd.selectedAgents)
      ? (pd.selectedAgents as string[])
      : [],
    skippedConnections: Array.isArray(pd.skippedConnections)
      ? (pd.skippedConnections as string[])
      : [],
    ...defaults,
  });
}

export const DEFAULT_POST_SETUP_CHECKLIST: Record<OnboardingChecklistKey, boolean> = {
  profile_complete: true,
  integrations_connected: false,
  agents_assigned: false,
  campaign_built: false,
  landing_page_ready: false,
  ai_active: false,
  team_invited: false,
};

export const POST_SETUP_CHECKLIST_META: Array<{
  key: OnboardingChecklistKey;
  label: string;
  description: string;
  href: string;
}> = [
  {
    key: "integrations_connected",
    label: "Connect integrations",
    description: "Link ads, CRM, email, or payments.",
    href: "/dashboard/integrations",
  },
  {
    key: "agents_assigned",
    label: "Activate an AI agent",
    description: "Turn on your first agent stack.",
    href: "/dashboard/agents",
  },
  {
    key: "landing_page_ready",
    label: "Publish a landing page",
    description: "Build a capture page in Funnel Studio.",
    href: "/dashboard/funnel",
  },
  {
    key: "campaign_built",
    label: "Create a campaign",
    description: "Draft ads or a growth engine run.",
    href: "/dashboard/campaign-ops",
  },
  {
    key: "team_invited",
    label: "Invite your team",
    description: "Add seats under Organization.",
    href: "/dashboard/organization?tab=team",
  },
  {
    key: "ai_active",
    label: "Run AI follow-up",
    description: "Enable automations or workflows.",
    href: "/dashboard/automations",
  },
];

/** Live launch checklist preview while the onboarding wizard is in progress. */
export function buildLaunchChecklistFromDraft(draft: OnboardingDraft): PostSetupChecklistItem[] {
  const flags: Record<OnboardingChecklistKey, boolean> = {
    profile_complete: Boolean(
      draft.businessName.trim() && draft.industry.trim() && draft.businessType.trim(),
    ),
    integrations_connected: draft.skippedConnections.length === 0,
    agents_assigned: draft.selectedAgents.length > 0,
    campaign_built: false,
    landing_page_ready: draft.selectedAgents.includes("landing"),
    ai_active: draft.selectedAgents.some((key) =>
      ["sms", "email", "pipeline"].includes(key),
    ),
    team_invited: false,
  };

  return POST_SETUP_CHECKLIST_META.map((meta) => ({
    ...meta,
    done: flags[meta.key],
  }));
}
