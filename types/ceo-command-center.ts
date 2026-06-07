/** Supabase-ready types for CEO Command Center dashboard data. */

export type KpiTrend = {
  value: string;
  change: string;
  changePositive: boolean;
  sparkline: number[];
};

export type KpiCardData = {
  id: string;
  label: string;
  value: string;
  trend: KpiTrend;
  icon: "dollar" | "users" | "calendar" | "cart" | "megaphone";
  accent: "green" | "blue" | "purple" | "orange" | "pink";
};

export type ProgressStepStatus = "completed" | "active" | "review" | "pending";

export type ProgressStep = {
  id: number;
  label: string;
  status: ProgressStepStatus;
};

export type HealthBreakdown = {
  label: string;
  score: number;
};

export type HealthScoreData = {
  score: number;
  maxScore: number;
  changePercent: number;
  message: string;
  breakdown: HealthBreakdown[];
};

export type RevenueGoalData = {
  monthlyGoal: number;
  currentRevenue: number;
  revenueGap: number;
  progressPercent: number;
  leadsNeeded: number;
  appointmentsNeeded: number;
  salesNeeded: number;
};

export type AiCoachRecommendation = {
  id: string;
  text: string;
};

export type AiCoachData = {
  greeting: string;
  summary: string;
  topPriority: {
    title: string;
    potentialRevenue: string;
    ctaLabel: string;
    ctaHref: string;
  };
  recommendations: AiCoachRecommendation[];
};

export type PipelineStage = {
  id: string;
  label: string;
  count: number;
  value: number;
};

export type LeadSource = {
  id: string;
  label: string;
  count: number;
  percent: number;
  color: string;
};

export type AiEmployee = {
  id: string;
  name: string;
  status: "active" | "idle" | "paused";
  description: string;
};

export type ActivityItem = {
  id: string;
  text: string;
  timeAgo: string;
};

export type TaskItem = {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
};

export type ConnectedAccount = {
  id: string;
  name: string;
  status: "connected" | "pending" | "disconnected";
};

export type CeoCommandCenterData = {
  user: {
    name: string;
    avatarInitials: string;
  };
  progressSteps: ProgressStep[];
  kpis: KpiCardData[];
  healthScore: HealthScoreData;
  revenueGoal: RevenueGoalData;
  aiCoach: AiCoachData;
  pipeline: PipelineStage[];
  leadSources: LeadSource[];
  aiEmployees: AiEmployee[];
  recentActivity: ActivityItem[];
  tasks: TaskItem[];
  connectedAccounts: ConnectedAccount[];
};

/** Onboarding flow types */
export type OnboardingStepId =
  | "business_profile"
  | "offer_goals"
  | "landing_pages"
  | "pipeline_workflow"
  | "connect_accounts"
  | "ai_agents"
  | "ads_agent"
  | "tracking"
  | "review"
  | "launch";

export type OnboardingStep = {
  id: OnboardingStepId;
  number: number;
  label: string;
};

export type BusinessProfileFields = {
  businessName: string;
  industry: string;
  services: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  businessHours: string;
  targetCustomer: string;
  keywords: string;
  seoMetaTitle: string;
  seoMetaDescription: string;
  mainOffer: string;
  competitors: string;
  bestCallToAction: string;
  brandVoice: string;
  businessDescription: string;
};

export type LandingPageOption = {
  id: string;
  title: string;
  description: string;
  type: "lead_gen" | "booking" | "special_offer";
};

export type IntegrationOption = {
  id: string;
  name: string;
  description?: string;
  connected: boolean;
};

export type ReviewChecklistItem = {
  id: string;
  label: string;
  complete: boolean;
};

export type OnboardingCommandCenterData = {
  steps: OnboardingStep[];
  currentStepId: OnboardingStepId;
  businessProfile: BusinessProfileFields;
  landingPages: LandingPageOption[];
  integrations: IntegrationOption[];
  reviewChecklist: ReviewChecklistItem[];
};
