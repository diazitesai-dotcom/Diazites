import type { SupabaseClient } from "@supabase/supabase-js";

import { ok, fail, type ServiceResult } from "@/lib/result";
import { createEmailCampaignRepository } from "@/repositories/email-campaign.repository";
import { sendEmail } from "@/services/email/email.service";
import { logAgentActivity } from "@/services/platform/agent-activity.service";
import { triggerEvent } from "@/services/events/event-dispatcher";
import { EVENT_TYPES } from "@/types/backend";
import { isOpenAiConfigured, callJsonResponses } from "@/services/engine/ai/openai-client";
import { z } from "zod";

const emailContentSchema = z.object({
  subject: z.string(),
  previewText: z.string(),
  htmlBody: z.string(),
  plainTextBody: z.string(),
});

export async function generateEmailCampaignContent(
  client: SupabaseClient,
  businessId: string,
  businessName: string,
  prompt: string,
): Promise<ServiceResult<{ subject: string; previewText: string; htmlBody: string; plainTextBody: string }>> {
  const fallback = {
    subject: `${businessName}: ${prompt.slice(0, 60)}`,
    previewText: prompt.slice(0, 120),
    htmlBody: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto"><h1>${businessName}</h1><p>${prompt}</p><p><a href="#">Learn more</a></p></div>`,
    plainTextBody: `${businessName}\n\n${prompt}`,
  };

  if (!isOpenAiConfigured()) return ok(fallback);

  const ai = await callJsonResponses({
    supabase: client,
    businessId,
    purpose: "email_campaign_builder",
    schema: emailContentSchema,
    system:
      "You write professional marketing emails for small businesses. Return HTML email body (inline styles), subject, preview text, and plain text version.",
    prompt: `Business: ${businessName}\nCampaign goal: "${prompt}"\nReturn compelling email content.`,
  });

  if (!ai.success) return ok(fallback);
  return ok(ai.data);
}

export async function sendEmailCampaign(
  client: SupabaseClient,
  businessId: string,
  campaignId: string,
  businessName: string,
): Promise<ServiceResult<{ sent: number; failed: number }>> {
  const repo = createEmailCampaignRepository(client);
  const { data: campaign, error } = await repo.getCampaign(campaignId, businessId);
  if (error || !campaign) return fail("Campaign not found");

  if (!campaign.audience_id) {
    return fail("Select an audience before sending.");
  }

  await repo.updateCampaign(campaignId, businessId, { status: "sending" });

  const { data: members } = await repo.listAudienceMembers(campaign.audience_id, businessId);
  const recipients = (members ?? []).filter((m) => m.email?.trim());

  if (recipients.length === 0) {
    await repo.updateCampaign(campaignId, businessId, { status: "draft" });
    return fail("Audience has no subscribed members.");
  }

  let sent = 0;
  let failed = 0;
  const fromLabel = campaign.from_name ?? businessName;

  for (const member of recipients.slice(0, 500)) {
    const html = campaign.html_body.replace(/\{\{name\}\}/gi, member.name?.split(" ")[0] ?? "there");
    const text =
      campaign.plain_text_body?.replace(/\{\{name\}\}/gi, member.name?.split(" ")[0] ?? "there") ??
      undefined;

    const result = await sendEmail({
      to: member.email,
      subject: campaign.subject,
      html,
      text,
    });

    await repo.insertCampaignSend({
      businessId,
      campaignId,
      email: member.email,
      audienceMemberId: member.id,
      status: result.success ? "sent" : "failed",
      providerMessageId: result.success ? result.data.id : undefined,
      errorDetail: result.success ? undefined : result.error,
    });

    if (result.success) sent++;
    else failed++;
  }

  const stats = {
    sent,
    delivered: sent,
    opened: 0,
    clicked: 0,
    bounced: failed,
    unsubscribed: 0,
  };

  await repo.updateCampaign(campaignId, businessId, {
    status: "sent",
    sent_at: new Date().toISOString(),
    stats,
  } as never);

  await triggerEvent(client, {
    type: EVENT_TYPES.AI_FOLLOW_UP_SENT,
    businessId,
    payload: { channel: "email", campaignId, sent, failed },
  });

  await logAgentActivity(client, {
    businessId,
    agentKey: "follow_up",
    actionType: "email_campaign_sent",
    entityType: "email_campaign",
    entityId: campaignId,
    payload: { sent, failed, name: campaign.name },
  });

  return ok({ sent, failed });
}
