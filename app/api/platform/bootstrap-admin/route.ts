import { NextResponse } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { grantPlatformAdmin } from "@/services/admin/admin-users.service";

/**
 * One-time bootstrap for the first platform admin on production.
 * Requires PLATFORM_BOOTSTRAP_SECRET in env. Disabled when unset.
 *
 * curl -X POST https://YOUR-DOMAIN/api/platform/bootstrap-admin \
 *   -H "Authorization: Bearer YOUR_SECRET" \
 *   -H "Content-Type: application/json" \
 *   -d '{"email":"you@company.com"}'
 */
export async function POST(request: Request) {
  const secret = process.env.PLATFORM_BOOTSTRAP_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "Bootstrap not enabled" }, { status: 404 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let email = "";
  try {
    const body = (await request.json()) as { email?: string };
    email = String(body.email ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const service = createServiceRoleClient();
  const { count } = await service.from("admin_users").select("id", { count: "exact", head: true });

  if ((count ?? 0) > 0 && process.env.PLATFORM_BOOTSTRAP_ALLOW_IF_ADMINS_EXIST !== "true") {
    return NextResponse.json(
      { error: "Platform admins already exist. Use Admin user manager or SQL instead." },
      { status: 409 },
    );
  }

  const { data: user } = await service
    .from("users")
    .select("id, email")
    .ilike("email", email.toLowerCase())
    .maybeSingle();

  if (!user) {
    return NextResponse.json(
      { error: "No user with that email. Sign up at /signup first, then retry." },
      { status: 404 },
    );
  }

  const result = await grantPlatformAdmin(service, user.id, user.email);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    userId: result.data.userId,
    message: "Platform admin granted. Visit /admin after refreshing.",
  });
}
