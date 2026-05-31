/** Product spec types — UI + API contracts for the growth platform MVP. */

export type CampaignGoalId =
  | "generate_leads"
  | "book_appointments"
  | "sell_products"
  | "promote_services"
  | "website_traffic"
  | "form_submissions"
  | "grow_email_list"
  | "retarget_visitors"
  | "local_ads"
  | "scale_campaigns";

export type CampaignLifecycleStatus =
  | "draft"
  | "needs_approval"
  | "approved"
  | "active"
  | "paused"
  | "failed"
  | "optimizing"
  | "completed";

export type AgentPermissionLevel =
  | "recommend_only"
  | "draft_only"
  | "auto_with_approval"
  | "full_auto";

export type PlatformAgentId =
  | "landing_page"
  | "ads"
  | "lead_management"
  | "sms"
  | "email"
  | "appointment"
  | "task"
  | "crm"
  | "optimization"
  | "reporting"
  | "creative"
  | "strategy"
  | "chat_assistant";

export type CrmPipelineStageId =
  | "new_lead"
  | "contacted"
  | "qualified"
  | "booked"
  | "proposal_sent"
  | "closed_won"
  | "closed_lost"
  | "nurture";

export type TaskStatus = "pending" | "in_progress" | "completed" | "overdue";
export type TaskPriority = "low" | "medium" | "high";

import type { AttributionModel } from "@/types/revenue-attribution";

export type BusinessProfile = {
  attributionModel?: AttributionModel;
  /** Shopify store domain, e.g. my-store.myshopify.com */
  shopifyShopDomain?: string;
  /** Per-store webhook signing secret from Shopify admin */
  shopifyWebhookSecret?: string;
  industry?: string;
  businessType?: string;
  businessEmail?: string;
  businessAddress?: string;
  serviceAreas?: string;
  mainServices?: string;
  targetAudience?: string;
  idealCustomer?: string;
  offerPromotion?: string;
  campaignGoal?: CampaignGoalId;
  brandTone?: string;
  brandColors?: string;
  existingCrm?: string;
  existingWebsite?: string;
  leadNotifyEmail?: string;
  leadNotifyPhone?: string;
  logoStoragePath?: string;
};

export type OnboardingWizardPayload = {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  website: string;
  businessEmail?: string;
  businessAddress?: string;
  serviceArea: string;
  cityState: string;
  services: string;
  businessHours: string;
  monthlyBudget: number;
  industry?: string;
  businessType?: string;
  mainServices?: string;
  targetAudience?: string;
  idealCustomer?: string;
  offerPromotion?: string;
  campaignGoal?: CampaignGoalId;
  brandTone?: string;
  brandColors?: string;
  existingCrm?: string;
  existingWebsite?: string;
  leadNotifyEmail?: string;
  leadNotifyPhone?: string;
  accountIntent?: "direct" | "agency" | "sub_account";
  selectedAgents?: string[];
  skippedConnections?: string[];
};

export type TaskRecord = {
  id: string;
  businessId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: string | null;
  sourceAgent: string | null;
  dueAt: string | null;
  createdAt: string;
};

export type AgentActionRecord = {
  id: string;
  businessId: string;
  agentType: string;
  actionType: string;
  summary: string;
  detail: Record<string, unknown>;
  approvalState: string | null;
  createdAt: string;
};
