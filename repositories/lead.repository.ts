import type { SupabaseClient } from "@supabase/supabase-js";

import type { LeadCreateInput, LeadUpdateInput } from "@/types/backend";
import type { PipelineStatus } from "@/types/domain";

export function createLeadRepository(client: SupabaseClient) {
  return {
    async create(input: LeadCreateInput) {
      return client
        .from("leads")
        .insert({
          business_id: input.businessId,
          campaign_id: input.campaignId ?? null,
          name: input.name,
          phone: input.phone ?? null,
          email: input.email ?? null,
          address: input.address ?? null,
          roofing_need: input.roofingNeed ?? null,
          timeline: input.timeline ?? null,
          notes: input.notes ?? null,
          source: input.source ?? "web",
        })
        .select("*")
        .single();
    },

    async listByBusiness(businessId: string) {
      return client
        .from("leads")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
    },

    async listByBusinessWithCampaign(businessId: string) {
      return client
        .from("leads")
        .select(
          `
          id,
          name,
          email,
          phone,
          address,
          source,
          status,
          notes,
          timeline,
          roofing_need,
          created_at,
          campaign_id,
          campaigns ( platform )
        `,
        )
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
    },

    async getById(leadId: string) {
      return client.from("leads").select("*").eq("id", leadId).maybeSingle();
    },

    async updateStatus(leadId: string, status: PipelineStatus) {
      return client.from("leads").update({ status }).eq("id", leadId).select("*").single();
    },

    async appendNote(leadId: string, noteLine: string) {
      const { data: lead, error: fetchError } = await client
        .from("leads")
        .select("notes")
        .eq("id", leadId)
        .single();
      if (fetchError) return { data: null, error: fetchError };
      const prev = lead?.notes ?? "";
      const next = prev ? `${prev}\n${noteLine}` : noteLine;
      return client.from("leads").update({ notes: next }).eq("id", leadId).select("*").single();
    },

    async updateFields(leadId: string, input: LeadUpdateInput) {
      const row: Record<string, unknown> = {};
      if (input.name !== undefined) row.name = input.name;
      if (input.phone !== undefined) row.phone = input.phone;
      if (input.email !== undefined) row.email = input.email;
      if (input.address !== undefined) row.address = input.address;
      if (input.roofingNeed !== undefined) row.roofing_need = input.roofingNeed;
      if (input.timeline !== undefined) row.timeline = input.timeline;
      if (input.notes !== undefined) row.notes = input.notes;
      if (input.source !== undefined) row.source = input.source;
      if (input.status !== undefined) row.status = input.status;
      return client.from("leads").update(row).eq("id", leadId).select("*").single();
    },

    async deleteById(leadId: string) {
      return client.from("leads").delete().eq("id", leadId);
    },

    async countByBusiness(businessId: string, since?: Date) {
      let q = client
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId);
      if (since) {
        q = q.gte("created_at", since.toISOString());
      }
      return q;
    },
  };
}
