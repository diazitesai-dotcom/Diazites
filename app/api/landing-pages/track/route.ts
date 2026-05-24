import { NextResponse } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { recordLandingPageVisit } from "@/services/landing/landing-page-editor.service";

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const body = json as {
    businessId?: string;
    landingPageId?: string;
    versionId?: string;
    campaignId?: string;
    source?: string;
    utmCampaign?: string;
    utmSource?: string;
    utmMedium?: string;
  };

  if (!body.businessId || !body.landingPageId) {
    return NextResponse.json({ success: false, error: "Missing ids" }, { status: 422 });
  }

  const supabase = createServiceRoleClient();
  await recordLandingPageVisit(supabase, {
    businessId: body.businessId,
    landingPageId: body.landingPageId,
    versionId: body.versionId ?? null,
    campaignId: body.campaignId ?? null,
    source: body.source ?? null,
    utmCampaign: body.utmCampaign ?? null,
    utmSource: body.utmSource ?? null,
    utmMedium: body.utmMedium ?? null,
  });

  return NextResponse.json({ success: true });
}
