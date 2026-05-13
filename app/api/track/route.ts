import { NextResponse } from "next/server";

import { checkRateLimit, clientIpFromRequest } from "@/lib/rate-limit";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { trackEventApiSchema } from "@/lib/validations/track";
import { createEngineEventRepository } from "@/repositories/engine-telemetry.repository";
import { createLandingPageRepository } from "@/repositories/landing-page.repository";

/**
 * Public engagement-tracking endpoint.
 *
 * Public landing pages POST here whenever an engagement event happens
 * (page_view on mount, cta_click on form button, etc.). We resolve the slug
 * back to a business + landing page id so the optimization loop has real
 * signals to analyze.
 *
 * No auth — these come from anonymous browsers. RLS is handled by
 * createServiceRoleClient, which is bypassed but inserts only target the
 * specific business resolved from the slug.
 */
export async function POST(request: Request) {
  const ip = clientIpFromRequest(request);
  // Track is much chattier than leads — looser bucket.
  const limit = checkRateLimit(`track:${ip}`, {
    capacity: 60,
    refillPerSecond: 1,
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

  const parsed = trackEventApiSchema.safeParse(json);
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
  let landingPageId: string | null = null;

  if (body.landingPageSlug) {
    const landingPages = createLandingPageRepository(supabase);
    const { data: lp } = await landingPages.getPublishedBySlug(body.landingPageSlug);
    if (lp) {
      businessId = lp.business_id;
      landingPageId = lp.id;
    }
  }

  if (!businessId) {
    return NextResponse.json(
      { success: false, error: "Could not resolve business for event" },
      { status: 422 },
    );
  }

  const events = createEngineEventRepository(supabase);
  const { error } = await events.record({
    businessId,
    landingPageId,
    eventType: body.type,
    payload: {
      ...(body.payload ?? {}),
      slug: body.landingPageSlug ?? null,
      receivedAt: new Date().toISOString(),
    },
  });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
