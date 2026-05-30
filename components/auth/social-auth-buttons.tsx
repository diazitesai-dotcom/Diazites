"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { AUTH_BRAND } from "@/lib/auth/auth-branding";
import {
  buildOAuthRedirectUrl,
  getConfiguredOAuthProviders,
  OAUTH_PROVIDER_META,
  type OAuthProviderId,
} from "@/lib/auth/oauth-providers";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const PROVIDER_ICONS: Record<OAuthProviderId, React.ReactNode> = {
  google: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  ),
  facebook: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
};

type SocialAuthButtonsProps = {
  mode: "signup" | "login";
  nextPath?: string;
  promoCode?: string;
  className?: string;
};

export function SocialAuthButtons({
  mode,
  nextPath = "/onboarding?welcome=trial",
  promoCode,
  className,
}: SocialAuthButtonsProps) {
  const enabledProviders = useMemo(() => getConfiguredOAuthProviders(), []);
  const [loading, setLoading] = useState<OAuthProviderId | null>(null);
  const [error, setError] = useState("");

  async function signInWith(provider: OAuthProviderId) {
    setError("");
    setLoading(provider);
    try {
      const supabase = createClient();
      const redirectTo = buildOAuthRedirectUrl(window.location.origin, {
        next: nextPath,
        promo: promoCode,
      });

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          queryParams:
            provider === "google"
              ? { access_type: "offline", prompt: "consent" }
              : undefined,
        },
      });

      if (oauthError) {
        setError(
          oauthError.message.includes("not enabled") ||
            oauthError.message.includes("validation_failed")
            ? `${OAUTH_PROVIDER_META[provider].label} sign-in is not enabled in Supabase. Enable the provider under Authentication → Providers and set ${OAUTH_PROVIDER_META[provider].envKey}=true in your app env.`
            : oauthError.message,
        );
        setLoading(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
      setLoading(null);
    }
  }

  const verb = mode === "signup" ? "Sign up" : "Continue";

  if (enabledProviders.length === 0) {
    return (
      <div className={cn("rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3", className)}>
        <p className="text-center text-sm text-muted-foreground">
          {mode === "signup" ? "Create your account" : "Sign in"} with{" "}
          <span className="font-medium text-foreground">email and password</span> below.
          Social sign-in is available once Google or Facebook is configured in Supabase and your
          app environment.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-center text-xs text-muted-foreground">
        {verb} with {AUTH_BRAND.platformName}
      </p>
      <div
        className={cn(
          "grid gap-2",
          enabledProviders.length === 1 ? "grid-cols-1" : "grid-cols-2",
        )}
      >
        {enabledProviders.map((id) => {
          const meta = OAUTH_PROVIDER_META[id];
          return (
            <button
              key={id}
              type="button"
              disabled={loading != null}
              onClick={() => signInWith(meta.supabaseProviderName)}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm font-medium transition hover:bg-white/[0.06] disabled:opacity-50"
            >
              {loading === id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                PROVIDER_ICONS[id]
              )}
              {meta.label}
            </button>
          );
        })}
      </div>
      {error ? (
        <p role="alert" className="text-center text-xs text-amber-400">
          {error}
        </p>
      ) : null}
      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">or use email</span>
        </div>
      </div>
    </div>
  );
}
