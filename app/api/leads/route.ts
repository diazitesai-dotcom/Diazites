import { NextResponse } from "next/server";

import { checkRateLimit, clientIpFromRequest } from "@/lib/rate-limit";
import { createLeadApiSchema } from "@/lib/validations/leads";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { createLandingPageRepository } from "@/repositories/landing-page.repository";
import { createLead } from "@/services/leads/lead.service";

export async function POST(request: Request) {
  const ip = clientIpFromRequest(request);
  const limit = checkRateLimit(`leads:${ip}`, {
    capacity: 6,
    refillPerSecond: 0.1,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      },
    );
  }

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

  let businessId = body.businessId ?? null;
  let resolvedSource = body.source?.trim() || "api";

  if (!businessId && body.landingPageSlug) {
    const landingPages = createLandingPageRepository(supabase);
    const { data: lp } = await landingPages.getPublishedBySlug(body.landingPageSlug);
    if (!lp) {
      return NextResponse.json(
        { success: false, error: "Landing page not found or not published" },
        { status: 404 },
      );
    }
    businessId = lp.business_id;
    resolvedSource = `landing:${body.landingPageSlug}`;
  }

  if (!businessId) {
    return NextResponse.json(
      { success: false, error: "Could not resolve business for lead" },
      { status: 422 },
    );
  }

  const email =
    body.email && typeof body.email === "string" && body.email.trim() !== ""
      ? body.email.trim()
      : null;

  const result = await createLead(supabase, {
    businessId,
    campaignId: body.campaignId ?? null,
    name: body.name.trim(),
    phone: body.phone?.trim() || null,
    email,
    address: body.address?.trim() || null,
    roofingNeed: body.roofingNeed?.trim() || null,
    timeline: body.timeline?.trim() || null,
    notes: body.notes?.trim() || null,
    source: resolvedSource,
  });

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    data: { leadId: result.data.id },
  });
}
