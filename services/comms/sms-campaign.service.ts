import type { SupabaseClient } from "@supabase/supabase-js";

import { ok, fail, type ServiceResult } from "@/lib/result";
import { createAiTextRepository } from "@/repositories/ai-text.repository";
import { sendSms } from "@/services/sms/sms.service";
import { logAgentActivity } from "@/services/platform/agent-activity.service";
import { triggerEvent } from "@/services/events/event-dispatcher";
import { EVENT_TYPES } from "@/types/backend";

function personalizeMessage(template: string, name?: string | null): string {
  return template.replace(/\{\{name\}\}/gi, name?.split(" ")[0] ?? "there");
}

export async function sendSmsCampaign(
  client: SupabaseClient,
  businessId: string,
  campaignId: string,
): Promise<ServiceResult<{ sent: number; failed: number }>> {
  const repo = createAiTextRepository(client);
  const { data: campaign, error } = await client
    .from("sms_campaigns")
    .select("*")
    .eq("id", campaignId)
    .eq("business_id", businessId)
    .single();

  if (error || !campaign) return fail("Campaign not found");

  await repo.updateCampaignStatus(campaignId, businessId, "sending");

  const recipients: { phone: string; contactId?: string; leadId?: string; name?: string }[] = [];

  if (campaign.audience_type === "all_contacts") {
    const { data: contacts } = await client
      .from("contacts")
      .select("id, phone, name")
      .eq("business_id", businessId)
      .not("phone", "is", null);
    for (const c of contacts ?? []) {
      if (c.phone?.trim()) {
        recipients.push({ phone: c.phone.trim(), contactId: c.id, name: c.name });
      }
    }
  } else {
    const { data: leads } = await client
      .from("leads")
      .select("id, phone, name")
      .eq("business_id", businessId)
      .not("phone", "is", null);
    for (const l of leads ?? []) {
      if (l.phone?.trim()) {
        recipients.push({ phone: l.phone.trim(), leadId: l.id, name: l.name });
      }
    }
  }

  if (recipients.length === 0) {
    await repo.updateCampaignStatus(campaignId, businessId, "draft");
    return fail("No recipients with phone numbers found in CRM.");
  }

  let sent = 0;
  let failed = 0;

  for (const r of recipients.slice(0, 200)) {
    const body = personalizeMessage(campaign.message_body, r.name);
    const result = await sendSms({ to: r.phone, body });

    await repo.insertCampaignSend({
      businessId,
      campaignId,
      contactId: r.contactId,
      leadId: r.leadId,
      phone: r.phone,
      status: result.ok ? "sent" : "failed",
      errorDetail: result.detail,
    });

    if (result.ok) {
      sent++;
      const { data: conv } = await client
        .from("conversations")
        .select("id")
        .eq("business_id", businessId)
        .eq("channel", "sms")
        .eq("contact_id", r.contactId ?? "")
        .maybeSingle();

      let conversationId = conv?.id;
      if (!conversationId && r.contactId) {
        const { data: created } = await client
          .from("conversations")
          .insert({
            business_id: businessId,
            contact_id: r.contactId,
            channel: "sms",
            last_message_at: new Date().toISOString(),
          })
          .select("id")
          .single();
        conversationId = created?.id;
      }

      if (conversationId) {
        await client.from("messages").insert({
          business_id: businessId,
          conversation_id: conversationId,
          direction: "outbound",
          body,
          metadata: { campaign_id: campaignId },
        });
      }
    } else {
      failed++;
    }
  }

  const stats = { sent, delivered: sent, failed, replied: 0 };
  await repo.updateCampaignStatus(campaignId, businessId, "sent", {
    sent_at: new Date().toISOString(),
    stats,
  } as never);

  await triggerEvent(client, {
    type: EVENT_TYPES.AI_FOLLOW_UP_SENT,
    businessId,
    payload: { channel: "sms", campaignId, sent, failed },
  });

  await logAgentActivity(client, {
    businessId,
    agentKey: "follow_up",
    actionType: "sms_campaign_sent",
    entityType: "sms_campaign",
    entityId: campaignId,
    payload: { sent, failed, name: campaign.name },
  });

  return ok({ sent, failed });
}
