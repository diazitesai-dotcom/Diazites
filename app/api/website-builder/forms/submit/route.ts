import { NextResponse } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { createLead } from "@/services/leads/lead.service";

type SubmitBody = {
  websiteId?: string;
  pageId?: string;
  formSlug?: string;
  payload?: Record<string, unknown>;
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
};

export async function POST(request: Request) {
  let body: SubmitBody;
  try {
    body = (await request.json()) as SubmitBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.websiteId || !body.pageId || !body.payload || typeof body.payload !== "object") {
    return NextResponse.json({ error: "Missing form payload" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data: page } = await supabase
    .from("website_pages")
    .select("*")
    .eq("id", body.pageId)
    .eq("website_id", body.websiteId)
    .eq("status", "published")
    .maybeSingle();

  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  const { data: form } = await supabase
    .from("website_forms")
    .select("*")
    .eq("website_id", body.websiteId)
    .eq("page_id", body.pageId)
    .eq("active", true)
    .ilike("slug", `%${body.formSlug || "lead-capture"}%`)
    .limit(1)
    .maybeSingle();

  const payload = body.payload;
  const businessId = String(page.business_id);
  const name = field(payload, "name") || "Website Lead";
  const email = field(payload, "email");
  const phone = field(payload, "phone");
  const message = field(payload, "message");

  const leadResult = await createLead(supabase, {
    businessId,
    name,
    email: email || null,
    phone: phone || null,
    notes: message || null,
    source: "website_builder",
    customFields: payload,
    utmSource: body.utmSource ?? null,
    utmMedium: body.utmMedium ?? null,
    utmCampaign: body.utmCampaign ?? null,
  });

  if (!leadResult.success) {
    return NextResponse.json({ error: leadResult.error }, { status: 500 });
  }

  const { data: contact } = await supabase
    .from("contacts")
    .insert({
      business_id: businessId,
      lead_id: leadResult.data.id,
      name,
      email: email || null,
      phone: phone || null,
      source: "website_builder",
      custom_fields: payload,
      pipeline_id: form?.pipeline_id ?? null,
      pipeline_stage_id: form?.pipeline_stage_id ?? null,
    })
    .select("id")
    .single();

  const { data: opportunity } = await supabase
    .from("opportunities")
    .insert({
      business_id: businessId,
      contact_id: contact?.id ?? null,
      pipeline_id: form?.pipeline_id ?? null,
      pipeline_stage_id: form?.pipeline_stage_id ?? null,
      title: `Website lead: ${name}`,
      status: "open",
    })
    .select("id")
    .single();

  await supabase.from("website_submissions").insert({
    business_id: businessId,
    website_id: body.websiteId,
    page_id: body.pageId,
    form_id: form?.id ?? null,
    contact_id: contact?.id ?? null,
    lead_id: leadResult.data.id,
    opportunity_id: opportunity?.id ?? null,
    payload,
    source: body.source ?? "website",
    utm_source: body.utmSource ?? null,
    utm_medium: body.utmMedium ?? null,
    utm_campaign: body.utmCampaign ?? null,
    user_agent: request.headers.get("user-agent"),
  });

  return NextResponse.json({
    success: true,
    leadId: leadResult.data.id,
    contactId: contact?.id ?? null,
    opportunityId: opportunity?.id ?? null,
  });
}

function field(payload: Record<string, unknown>, key: string): string {
  const value = payload[key];
  return typeof value === "string" ? value.trim() : "";
}
