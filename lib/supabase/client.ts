"use client";

import { createBrowserClient } from "@supabase/ssr";
import { parse, serialize } from "cookie";

import { requireSupabasePublicEnv } from "@/lib/env";

export function createClient() {
  const { url, anonKey } = requireSupabasePublicEnv();
  return createBrowserClient(url, anonKey, {
    cookies: {
      getAll() {
        if (typeof document === "undefined") return [];
        const parsed = parse(document.cookie);
        return Object.keys(parsed).map((name) => ({
          name,
          value: parsed[name] ?? "",
        }));
      },
      setAll(cookiesToSet) {
        if (typeof document === "undefined") return;
        cookiesToSet.forEach(({ name, value, options }) => {
          document.cookie = serialize(name, value, options);
        });
      },
    },
  });
}
