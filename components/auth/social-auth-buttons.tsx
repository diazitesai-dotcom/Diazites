"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { AUTH_BRAND } from "@/lib/auth/auth-branding";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type OAuthProvider = "google" | "facebook" | "apple" | "azure";

const PROVIDERS: {
  id: OAuthProvider;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "google",
    label: "Google",
    icon: (
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
  },
  {
    id: "facebook",
    label: "Facebook",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    id: "apple",
    label: "Apple",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
      </svg>
    ),
  },
  {
    id: "azure",
    label: "Microsoft",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
        <path fill="#f25022" d="M1 1h10v10H1z" />
        <path fill="#00a4ef" d="M13 1h10v10H13z" />
        <path fill="#7fba00" d="M1 13h10v10H1z" />
        <path fill="#ffb900" d="M13 13h10v10H13z" />
      </svg>
    ),
  },
];

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
  const [loading, setLoading] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState("");

  async function signInWith(provider: OAuthProvider) {
    setError("");
    setLoading(provider);
    try {
      const supabase = createClient();
      const params = new URLSearchParams({ next: nextPath });
      if (promoCode?.trim()) params.set("promo", promoCode.trim());
      const redirectTo = `${window.location.origin}/auth/callback?${params.toString()}`;

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
          oauthError.message.includes("not enabled")
            ? `${provider} sign-in is not enabled yet. Enable it in your Supabase Auth providers settings.`
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

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-center text-xs text-muted-foreground">
        {verb} with {AUTH_BRAND.platformName}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {PROVIDERS.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={loading != null}
            onClick={() => signInWith(p.id)}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm font-medium transition hover:bg-white/[0.06] disabled:opacity-50"
          >
            {loading === p.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              p.icon
            )}
            {p.label}
          </button>
        ))}
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
