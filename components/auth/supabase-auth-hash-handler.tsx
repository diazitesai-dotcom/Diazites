"use client";

import { useEffect, useRef } from "react";

import { createClient } from "@/lib/supabase/client";

/**
 * Supabase magic links and some OAuth flows return tokens in the URL hash.
 * The server cannot read `#...`, so we exchange them for a session on the client
 * then send the user to the app shell.
 */
export function SupabaseAuthHashHandler() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;

    const hasImplicitTokens = hash.includes("access_token") && hash.includes("refresh_token");
    const hasAuthError =
      hash.includes("error=") || hash.includes("error_code") || hash.includes("error_description");

    if (!hasImplicitTokens && !hasAuthError) return;

    ran.current = true;

    const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    const fail = (message: string) => {
      window.location.replace(`/login?error=${encodeURIComponent(message)}`);
    };

    void (async () => {
      try {
        const supabase = createClient();

        if (hasAuthError && !access_token) {
          fail(
            params.get("error_description") ??
              params.get("error") ??
              "Sign-in link is invalid or expired.",
          );
          return;
        }

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (error) {
            fail(error.message);
            return;
          }
        }

        const { data, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr || !data.session) {
          fail(sessionErr?.message ?? "Could not establish a session from this link.");
          return;
        }

        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        window.location.assign("/dashboard");
      } catch (e) {
        fail(e instanceof Error ? e.message : "Sign-in failed");
      }
    })();
  }, []);

  return null;
}
