import type { SupabaseClient } from "@supabase/supabase-js";

import { createAiMessageRepository } from "@/repositories/ai-message.repository";
import { createBusinessRepository } from "@/repositories/business.repository";
import { createLeadRepository } from "@/repositories/lead.repository";
import { generateAIMessage } from "@/services/ai/message-generation.service";
import { sendEmail } from "@/services/email/email.service";
import { EVENT_TYPES } from "@/types/backend";

import { createSystemEventRepository } from "@/repositories/system-event.repository";

/**
 * AI follow-up + persistence. Invoked after LEAD_CREATED is recorded (avoid infinite recursion by not re-emitting LEAD_CREATED).
 */
export async function runLeadCreatedAutomation(
  client: SupabaseClient,
  businessId: string,
  leadId: string,
): Promise<void> {
  const leads = createLeadRepository(client);
  const businesses = createBusinessRepository(client);
  const aiRepo = createAiMessageRepository(client);

  const { data: lead, error: leadErr } = await leads.getById(leadId);
  if (leadErr || !lead) return;

  const { data: business } = await businesses.getById(businessId);
  const businessName = business?.name ?? "Your roofing partner";

  const aiResult = await generateAIMessage({
    leadName: lead.name,
    leadEmail: lead.email,
    roofingNeed: lead.roofing_need,
    timeline: lead.timeline,
    businessName,
    serviceArea: business?.service_area ?? null,
  });

  if (!aiResult.success) {
    console.error("[lead-automation] generation failed", aiResult.error);
    return;
  }

  const body = aiResult.data.body;
  const model = aiResult.data.model;

  if (lead.email) {
    const sent = await sendEmail({
      to: lead.email,
      subject: `Thanks for reaching out, ${lead.name}`,
      text: body,
    });

    if (!sent.success) {
      console.error("[lead-automation] email failed", sent.error);
    }
  }

  await aiRepo.create({
    leadId,
    businessId,
    channel: "email",
    messageBody: body,
    model,
    status: lead.email ? "sent" : "draft_no_email",
  });

  try {
    const events = createSystemEventRepository(client);
    await events.insert({
      businessId,
      leadId,
      eventType: EVENT_TYPES.AI_FOLLOW_UP_SENT,
      payload: { model, emailed: Boolean(lead.email) },
    });
  } catch (e) {
    console.error("[lead-automation] AI_FOLLOW_UP event log failed", e);
  }
}
