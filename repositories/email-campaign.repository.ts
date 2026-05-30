import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  EmailAudienceRow,
  EmailCampaignDashboardStats,
  EmailCampaignRow,
  EmailTemplateRow,
} from "@/types/diazites-platform";

export function createEmailCampaignRepository(client: SupabaseClient) {
  return {
    async listAudiences(businessId: string) {
      return client
        .from("email_audiences")
        .select("*")
        .eq("business_id", businessId)
        .order("name");
    },

    async createAudience(input: { businessId: string; name: string; description?: string }) {
      return client
        .from("email_audiences")
        .insert({
          business_id: input.businessId,
          name: input.name,
          description: input.description ?? null,
        })
        .select("*")
        .single();
    },

    async syncAudienceFromContacts(audienceId: string, businessId: string) {
      const { data: contacts } = await client
        .from("contacts")
        .select("id, email, name")
        .eq("business_id", businessId)
        .not("email", "is", null);

      const rows = (contacts ?? [])
        .filter((c) => c.email?.trim())
        .map((c) => ({
          audience_id: audienceId,
          business_id: businessId,
          contact_id: c.id,
          email: c.email!.trim().toLowerCase(),
          name: c.name,
          status: "subscribed",
        }));

      if (rows.length === 0) {
        await client.from("email_audiences").update({ contact_count: 0 }).eq("id", audienceId);
        return { count: 0 };
      }

      await client.from("email_audience_members").upsert(rows, {
        onConflict: "audience_id,email",
        ignoreDuplicates: false,
      });

      const { count } = await client
        .from("email_audience_members")
        .select("id", { count: "exact", head: true })
        .eq("audience_id", audienceId)
        .eq("status", "subscribed");

      await client
        .from("email_audiences")
        .update({ contact_count: count ?? rows.length, updated_at: new Date().toISOString() })
        .eq("id", audienceId);

      return { count: count ?? rows.length };
    },

    async listTemplates(businessId: string) {
      return client
        .from("email_templates")
        .select("*")
        .eq("business_id", businessId)
        .order("updated_at", { ascending: false });
    },

    async createTemplate(input: {
      businessId: string;
      name: string;
      subject: string;
      htmlBody: string;
      plainTextBody?: string;
      previewText?: string;
      isAiGenerated?: boolean;
    }) {
      return client
        .from("email_templates")
        .insert({
          business_id: input.businessId,
          name: input.name,
          subject: input.subject,
          html_body: input.htmlBody,
          plain_text_body: input.plainTextBody ?? null,
          preview_text: input.previewText ?? null,
          is_ai_generated: input.isAiGenerated ?? false,
        })
        .select("*")
        .single();
    },

    async listCampaigns(businessId: string) {
      return client
        .from("email_campaigns")
        .select("*, email_audiences(name)")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
    },

    async getCampaign(id: string, businessId: string) {
      return client
        .from("email_campaigns")
        .select("*")
        .eq("id", id)
        .eq("business_id", businessId)
        .maybeSingle();
    },

    async createCampaign(input: {
      businessId: string;
      name: string;
      subject: string;
      htmlBody: string;
      plainTextBody?: string;
      audienceId?: string | null;
      templateId?: string | null;
      previewText?: string;
      fromName?: string;
    }) {
      return client
        .from("email_campaigns")
        .insert({
          business_id: input.businessId,
          name: input.name,
          subject: input.subject,
          html_body: input.htmlBody,
          plain_text_body: input.plainTextBody ?? null,
          audience_id: input.audienceId ?? null,
          template_id: input.templateId ?? null,
          preview_text: input.previewText ?? null,
          from_name: input.fromName ?? null,
        })
        .select("*")
        .single();
    },

    async updateCampaign(
      id: string,
      businessId: string,
      patch: Partial<EmailCampaignRow> & Record<string, unknown>,
    ) {
      return client
        .from("email_campaigns")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("business_id", businessId)
        .select("*")
        .single();
    },

    async listAudienceMembers(audienceId: string, businessId: string) {
      return client
        .from("email_audience_members")
        .select("*")
        .eq("audience_id", audienceId)
        .eq("business_id", businessId)
        .eq("status", "subscribed");
    },

    async insertCampaignSend(input: {
      businessId: string;
      campaignId: string;
      email: string;
      audienceMemberId?: string;
      status: string;
      providerMessageId?: string;
      errorDetail?: string;
    }) {
      return client.from("email_campaign_sends").insert({
        business_id: input.businessId,
        campaign_id: input.campaignId,
        email: input.email,
        audience_member_id: input.audienceMemberId ?? null,
        status: input.status,
        provider_message_id: input.providerMessageId ?? null,
        error_detail: input.errorDetail ?? null,
        sent_at: input.status === "sent" ? new Date().toISOString() : null,
      });
    },

    async listAutomations(businessId: string) {
      return client
        .from("email_automations")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
    },

    async dashboardStats(businessId: string): Promise<EmailCampaignDashboardStats> {
      const [campaigns, audiences, automations, sends] = await Promise.all([
        client.from("email_campaigns").select("id, status, stats").eq("business_id", businessId),
        client.from("email_audiences").select("contact_count").eq("business_id", businessId),
        client.from("email_automations").select("id, status").eq("business_id", businessId),
        client.from("email_campaign_sends").select("status").eq("business_id", businessId),
      ]);

      const campRows = campaigns.data ?? [];
      const sendRows = sends.data ?? [];
      const opened = sendRows.filter((s) => s.status === "opened").length;
      const clicked = sendRows.filter((s) => s.status === "clicked").length;
      const delivered = sendRows.filter((s) => s.status === "sent" || s.status === "delivered").length;

      return {
        totalCampaigns: campRows.length,
        drafts: campRows.filter((c) => c.status === "draft").length,
        sent: campRows.filter((c) => c.status === "sent").length,
        scheduled: campRows.filter((c) => c.status === "scheduled").length,
        totalSubscribers: (audiences.data ?? []).reduce((s, a) => s + (a.contact_count ?? 0), 0),
        avgOpenRate: delivered > 0 ? Math.round((opened / delivered) * 100) : 0,
        avgClickRate: delivered > 0 ? Math.round((clicked / delivered) * 100) : 0,
        automationsActive: (automations.data ?? []).filter((a) => a.status === "active").length,
      };
    },
  };
}
