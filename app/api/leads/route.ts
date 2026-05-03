import { NextResponse } from "next/server";

import { createLeadApiSchema } from "@/lib/validations/leads";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { createLead } from "@/services/leads/lead.service";

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = createLeadApiSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Validation failed",
        details: parsed.error.flatten(),
      },
      { status: 422 },
    );
  }

  const body = parsed.data;
  const supabase = createServiceRoleClient();

  const email =
    body.email && typeof body.email === "string" && body.email.trim() !== ""
      ? body.email.trim()
      : null;

  const result = await createLead(supabase, {
    businessId: body.businessId,
    campaignId: body.campaignId ?? null,
    name: body.name.trim(),
    phone: body.phone?.trim() || null,
    email,
    address: body.address?.trim() || null,
    roofingNeed: body.roofingNeed?.trim() || null,
    timeline: body.timeline?.trim() || null,
    notes: body.notes?.trim() || null,
    source: body.source?.trim() || "api",
  });

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    data: { leadId: result.data.id },
  });
}
