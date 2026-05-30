import type { SupabaseClient } from "@supabase/supabase-js";

import type { DiazitesWorkflowRow, WorkflowDashboardStats, WorkflowDefinition } from "@/types/diazites-platform";

export function createWorkflowRepository(client: SupabaseClient) {
  return {
    async listForBusiness(businessId: string) {
      return client
        .from("diazites_workflows")
        .select("*")
        .eq("business_id", businessId)
        .order("updated_at", { ascending: false });
    },

    async getById(id: string, businessId: string) {
      return client
        .from("diazites_workflows")
        .select("*")
        .eq("id", id)
        .eq("business_id", businessId)
        .maybeSingle();
    },

    async create(input: {
      businessId: string;
      name: string;
      description?: string;
      definition: WorkflowDefinition;
      triggerType?: string;
      pipelineId?: string | null;
    }) {
      return client
        .from("diazites_workflows")
        .insert({
          business_id: input.businessId,
          name: input.name,
          description: input.description ?? null,
          definition: input.definition,
          trigger_type: input.triggerType ?? "new_lead_created",
          pipeline_id: input.pipelineId ?? null,
          status: "draft",
        })
        .select("*")
        .single();
    },

    async update(
      id: string,
      businessId: string,
      patch: Partial<{
        name: string;
        description: string;
        definition: WorkflowDefinition;
        status: string;
        trigger_type: string;
        pipeline_id: string | null;
        pipeline_stage_id: string | null;
      }>,
    ) {
      return client
        .from("diazites_workflows")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("business_id", businessId)
        .select("*")
        .single();
    },

    async delete(id: string, businessId: string) {
      return client.from("diazites_workflows").delete().eq("id", id).eq("business_id", businessId);
    },

    async listTemplates() {
      return client.from("workflow_templates").select("*").order("name");
    },

    async getTemplateBySlug(slug: string) {
      return client.from("workflow_templates").select("*").eq("slug", slug).maybeSingle();
    },

    async dashboardStats(businessId: string): Promise<WorkflowDashboardStats> {
      const { data: workflows } = await client
        .from("diazites_workflows")
        .select("status, conversion_rate, revenue_attributed")
        .eq("business_id", businessId);

      const rows = workflows ?? [];
      const { count: enrollments } = await client
        .from("workflow_enrollments")
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId)
        .eq("status", "active");

      const { data: runs } = await client
        .from("workflow_runs")
        .select("status")
        .eq("business_id", businessId);

      const runRows = runs ?? [];
      return {
        active: rows.filter((w) => w.status === "active").length,
        draft: rows.filter((w) => w.status === "draft").length,
        paused: rows.filter((w) => w.status === "paused").length,
        completedRuns: runRows.filter((r) => r.status === "completed").length,
        failedRuns: runRows.filter((r) => r.status === "failed").length,
        leadsInWorkflows: enrollments ?? 0,
        conversionRate:
          rows.length > 0
            ? rows.reduce((s, w) => s + Number(w.conversion_rate ?? 0), 0) / rows.length
            : 0,
        revenueAttributed: rows.reduce((s, w) => s + Number(w.revenue_attributed ?? 0), 0),
        scheduledActions: 0,
      };
    },

    async recentRuns(businessId: string, limit = 20) {
      return client
        .from("workflow_runs")
        .select("*, diazites_workflows(name)")
        .eq("business_id", businessId)
        .order("started_at", { ascending: false })
        .limit(limit);
    },
  };
}

export type { DiazitesWorkflowRow };
