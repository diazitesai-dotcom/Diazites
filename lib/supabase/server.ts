import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { requireSupabasePublicEnv, requireSupabaseServiceEnv } from "@/lib/env";

export async function createServerSupabaseClient() {
  const { url, anonKey } = requireSupabasePublicEnv();
  const cookieStore = await cookies();

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components cannot always set cookies; Server Actions can.
            // Session refresh is handled by middleware when this path omits writes.
          }
        },
      },
    },
  );
}

export function createServiceRoleClient() {
  const { url, serviceKey } = requireSupabaseServiceEnv();
  return createServerClient(
    url,
    serviceKey,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    },
  );
}
