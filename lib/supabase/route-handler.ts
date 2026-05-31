import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

import { requireSupabasePublicEnv } from "@/lib/env";

/**
 * Supabase client for Route Handlers: reads PKCE/session cookies from the
 * incoming request and writes auth cookies onto the outgoing response.
 */
export function createRouteHandlerSupabaseClient(
  request: NextRequest,
  response: NextResponse,
) {
  const { url, anonKey } = requireSupabasePublicEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });
}
