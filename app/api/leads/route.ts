import { NextResponse } from "next/server";

import { generateLeadFollowUp } from "@/services/ai/response-service";
import { sendLeadFollowUpEmail } from "@/services/email/resend-service";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json();
  const supabase = createServiceRoleClient();

  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      business_id: body.businessId,
      campaign_id: body.campaignId ?? null,
      name: body.name,
      phone: body.phone,
      email: body.email,
      address: body.address,
      roofing_need: body.roofingNeed,
      timeline: body.timeline,
      notes: body.notes,
      source: body.source ?? "landing_page",
    })
    .select("*")
    .single();

  if (error || !lead) {
    return NextResponse.json({ error: error?.message ?? "Failed to create lead" }, { status: 400 });
  }

  const message = await generateLeadFollowUp({
    leadName: lead.name,
    roofingNeed: lead.roofing_need ?? "roofing project",
    businessName: "Diazites Partner Contractor",
  });

  if (lead.email) {
    await sendLeadFollowUpEmail({
      to: lead.email,
      subject: `Thanks for contacting us, ${lead.name}`,
      body: message,
    });
  }

  await supabase.from("ai_messages").insert({
    lead_id: lead.id,
    business_id: lead.business_id,
    channel: "email",
    message_body: message,
    model: "gpt-4.1-mini",
    status: "sent",
  });

  return NextResponse.json({ leadId: lead.id, status: "ok" });
}
