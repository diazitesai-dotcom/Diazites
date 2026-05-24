import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ApprovalStatus,
  ApprovalType,
  LandingFormField,
  LandingSection,
  LandingVersionLabel,
} from "@/types/marketing-os";

export function createLandingPageVersionRepository(client: SupabaseClient) {
  return {
    async create(input: {
      landingPageId: string;
      businessId: string;
      versionLabel: LandingVersionLabel;
      name: string;
      sections?: LandingSection[];
      formFields?: LandingFormField[];
      trafficWeight?: number;
    }) {
      return client
        .from("landing_page_versions")
        .insert({
          landing_page_id: input.landingPageId,
          business_id: input.businessId,
          version_label: input.versionLabel,
          name: input.name,
          sections: input.sections ?? [],
          form_fields: input.formFields ?? [],
          traffic_weight: input.trafficWeight ?? 0,
        })
        .select("*")
        .single();
    },

    async getById(id: string) {
      return client.from("landing_page_versions").select("*").eq("id", id).maybeSingle();
    },

    async listByLandingPage(landingPageId: string) {
      return client
        .from("landing_page_versions")
        .select("*")
        .eq("landing_page_id", landingPageId)
        .order("created_at", { ascending: true });
    },

    async update(
      id: string,
      patch: Partial<{
        name: string;
        sections: LandingSection[];
        formFields: LandingFormField[];
        trafficWeight: number;
        isWinner: boolean;
        aiScores: Record<string, unknown>;
        versionLabel: LandingVersionLabel;
        publishedAt: string | null;
      }>,
    ) {
      const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (patch.name !== undefined) row.name = patch.name;
      if (patch.sections !== undefined) row.sections = patch.sections;
      if (patch.formFields !== undefined) row.form_fields = patch.formFields;
      if (patch.trafficWeight !== undefined) row.traffic_weight = patch.trafficWeight;
      if (patch.isWinner !== undefined) row.is_winner = patch.isWinner;
      if (patch.aiScores !== undefined) row.ai_scores = patch.aiScores;
      if (patch.versionLabel !== undefined) row.version_label = patch.versionLabel;
      if (patch.publishedAt !== undefined) row.published_at = patch.publishedAt;

      return client.from("landing_page_versions").update(row).eq("id", id).select("*").single();
    },

    async delete(id: string) {
      return client.from("landing_page_versions").delete().eq("id", id);
    },
  };
}

export function createLandingPageAssetRepository(client: SupabaseClient) {
  return {
    async listByLandingPage(landingPageId: string) {
      return client
        .from("landing_page_assets")
        .select("*")
        .eq("landing_page_id", landingPageId)
        .order("created_at", { ascending: false });
    },

    async create(input: {
      businessId: string;
      landingPageId: string;
      assetType: string;
      fileUrl: string;
      fileName?: string;
      mimeType?: string;
      metadata?: Record<string, unknown>;
    }) {
      return client
        .from("landing_page_assets")
        .insert({
          business_id: input.businessId,
          landing_page_id: input.landingPageId,
          asset_type: input.assetType,
          file_url: input.fileUrl,
          file_name: input.fileName ?? null,
          mime_type: input.mimeType ?? null,
          metadata: input.metadata ?? {},
        })
        .select("*")
        .single();
    },

    async delete(id: string, businessId: string) {
      return client
        .from("landing_page_assets")
        .delete()
        .eq("id", id)
        .eq("business_id", businessId);
    },
  };
}

export function createLandingPageAnalyticsRepository(client: SupabaseClient) {
  return {
    async recordVisit(input: {
      businessId: string;
      landingPageId: string;
      versionId?: string | null;
      campaignId?: string | null;
      source?: string | null;
      utmCampaign?: string | null;
      utmSource?: string | null;
      utmMedium?: string | null;
    }) {
      const today = new Date().toISOString().slice(0, 10);
      const { data: existing } = await client
        .from("landing_page_analytics")
        .select("id, visitors")
        .eq("landing_page_id", input.landingPageId)
        .eq("analytics_date", today)
        .eq("version_id", input.versionId ?? null)
        .maybeSingle();

      if (existing?.id) {
        return client
          .from("landing_page_analytics")
          .update({ visitors: (existing.visitors ?? 0) + 1 })
          .eq("id", existing.id);
      }

      return client.from("landing_page_analytics").insert({
        business_id: input.businessId,
        landing_page_id: input.landingPageId,
        version_id: input.versionId ?? null,
        campaign_id: input.campaignId ?? null,
        analytics_date: today,
        visitors: 1,
        submissions: 0,
        source: input.source ?? null,
        utm_campaign: input.utmCampaign ?? null,
        utm_source: input.utmSource ?? null,
        utm_medium: input.utmMedium ?? null,
      });
    },

    async recordSubmission(input: {
      businessId: string;
      landingPageId: string;
      versionId?: string | null;
    }) {
      const today = new Date().toISOString().slice(0, 10);
      const { data: existing } = await client
        .from("landing_page_analytics")
        .select("id, visitors, submissions")
        .eq("landing_page_id", input.landingPageId)
        .eq("analytics_date", today)
        .eq("version_id", input.versionId ?? null)
        .maybeSingle();

      if (existing?.id) {
        const submissions = (existing.submissions ?? 0) + 1;
        const visitors = Math.max(existing.visitors ?? 1, 1);
        const conversionRate = submissions / visitors;
        return client
          .from("landing_page_analytics")
          .update({ submissions, conversion_rate: conversionRate })
          .eq("id", existing.id);
      }

      return client.from("landing_page_analytics").insert({
        business_id: input.businessId,
        landing_page_id: input.landingPageId,
        version_id: input.versionId ?? null,
        analytics_date: today,
        visitors: 1,
        submissions: 1,
        conversion_rate: 1,
      });
    },

    async summaryByLandingPage(landingPageId: string) {
      return client
        .from("landing_page_analytics")
        .select("*")
        .eq("landing_page_id", landingPageId)
        .order("analytics_date", { ascending: false })
        .limit(90);
    },
  };
}

export function createApprovalRepository(client: SupabaseClient) {
  return {
    async create(input: {
      businessId: string;
      approvalType: ApprovalType;
      title: string;
      description?: string;
      entityType?: string;
      entityId?: string;
      riskScore: number;
      confidenceScore?: number;
      expectedImpact?: string;
      explanation?: Record<string, unknown>;
      payload?: Record<string, unknown>;
      requestedByType?: string;
      requestedById?: string;
    }) {
      return client
        .from("approval_requests")
        .insert({
          business_id: input.businessId,
          approval_type: input.approvalType,
          title: input.title,
          description: input.description ?? null,
          entity_type: input.entityType ?? null,
          entity_id: input.entityId ?? null,
          risk_score: input.riskScore,
          confidence_score: input.confidenceScore ?? null,
          expected_impact: input.expectedImpact ?? null,
          explanation: input.explanation ?? {},
          payload: input.payload ?? {},
          requested_by_type: input.requestedByType ?? "ai",
          requested_by_id: input.requestedById ?? null,
        })
        .select("*")
        .single();
    },

    async listPending(businessId: string) {
      return client
        .from("approval_requests")
        .select("*")
        .eq("business_id", businessId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
    },

    async listAll(businessId: string, limit = 50) {
      return client
        .from("approval_requests")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(limit);
    },

    async decide(
      id: string,
      businessId: string,
      decision: {
        status: ApprovalStatus;
        decidedBy: string;
        decisionNote?: string;
      },
    ) {
      return client
        .from("approval_requests")
        .update({
          status: decision.status,
          decided_by: decision.decidedBy,
          decision_note: decision.decisionNote ?? null,
          decided_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("business_id", businessId)
        .select("*")
        .single();
    },
  };
}

export function createOptimizationRepository(client: SupabaseClient) {
  return {
    async create(input: {
      businessId: string;
      campaignId?: string | null;
      landingPageId?: string | null;
      recommendationType: string;
      title: string;
      confidenceScore: number;
      riskScore: number;
      expectedImpact?: string;
      explanation?: Record<string, unknown>;
      suggestedAction?: Record<string, unknown>;
    }) {
      return client
        .from("optimization_recommendations")
        .insert({
          business_id: input.businessId,
          campaign_id: input.campaignId ?? null,
          landing_page_id: input.landingPageId ?? null,
          recommendation_type: input.recommendationType,
          title: input.title,
          confidence_score: input.confidenceScore,
          risk_score: input.riskScore,
          expected_impact: input.expectedImpact ?? null,
          explanation: input.explanation ?? {},
          suggested_action: input.suggestedAction ?? {},
        })
        .select("*")
        .single();
    },

    async listByBusiness(businessId: string, status?: string) {
      let query = client
        .from("optimization_recommendations")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });

      if (status) query = query.eq("status", status);
      return query;
    },

    async updateStatus(id: string, businessId: string, status: string) {
      const row: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (status === "applied") row.applied_at = new Date().toISOString();

      return client
        .from("optimization_recommendations")
        .update(row)
        .eq("id", id)
        .eq("business_id", businessId)
        .select("*")
        .single();
    },
  };
}

export function createGrowthEngineRepository(client: SupabaseClient) {
  return {
    async create(businessId: string, inputUrl: string) {
      return client
        .from("growth_engine_runs")
        .insert({
          business_id: businessId,
          input_url: inputUrl,
          status: "in_progress",
          current_stage: "input",
          stage_progress: 5,
        })
        .select("*")
        .single();
    },

    async listRecent(businessId: string, limit = 10) {
      return client
        .from("growth_engine_runs")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(limit);
    },

    async updateStage(
      id: string,
      businessId: string,
      patch: Record<string, unknown>,
    ) {
      return client
        .from("growth_engine_runs")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("business_id", businessId)
        .select("*")
        .single();
    },
  };
}

export function createLeadEventRepository(client: SupabaseClient) {
  return {
    async insert(input: {
      businessId: string;
      leadId: string;
      eventType: string;
      actorType?: string;
      payload?: Record<string, unknown>;
    }) {
      return client
        .from("lead_events")
        .insert({
          business_id: input.businessId,
          lead_id: input.leadId,
          event_type: input.eventType,
          actor_type: input.actorType ?? "system",
          payload: input.payload ?? {},
        })
        .select("*")
        .single();
    },

    async listByLead(leadId: string) {
      return client
        .from("lead_events")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: true });
    },
  };
}
