"use client";

import Link from "next/link";
import { CheckCircle2, CircleAlert, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OAUTH_PROVIDER_META, type OAuthProviderId } from "@/lib/auth/oauth-providers";

type Props = {
  appUrl: string;
  supabaseAuthProvidersUrl: string;
  providerFlags: Record<OAuthProviderId, boolean>;
};

export function AdminAuthSetupClient({
  appUrl,
  supabaseAuthProvidersUrl,
  providerFlags,
}: Props) {
  const configured = (["google", "facebook"] as OAuthProviderId[]).filter((id) => providerFlags[id]);

  return (
    <div className="space-y-6">
      <Card className="border-white/[0.06]">
        <CardHeader>
          <CardTitle>OAuth provider status (app)</CardTitle>
          <CardDescription>
            Social buttons only appear when the env flag is set. Supabase must also have the
            provider enabled with valid OAuth credentials.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(["google", "facebook"] as OAuthProviderId[]).map((id) => {
            const meta = OAUTH_PROVIDER_META[id];
            const appOn = providerFlags[id];
            return (
              <div
                key={id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/[0.06] px-4 py-3"
              >
                <div>
                  <p className="font-medium">{meta.label}</p>
                  <p className="font-mono text-xs text-muted-foreground">{meta.envKey}</p>
                </div>
                <Badge variant={appOn ? "default" : "secondary"}>
                  {appOn ? "Shown in app" : "Hidden (env off)"}
                </Badge>
              </div>
            );
          })}
          {configured.length === 0 ? (
            <p className="flex items-start gap-2 text-sm text-amber-400/90">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              No OAuth buttons are visible. Users fall back to email/password only until you enable
              providers below.
            </p>
          ) : (
            <p className="flex items-start gap-2 text-sm text-emerald-400/90">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              {configured.length} provider(s) configured in app env. Confirm matching providers are
              enabled in Supabase.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-white/[0.06]">
        <CardHeader>
          <CardTitle>Supabase Authentication setup</CardTitle>
          <CardDescription>
            Required for Google and Facebook sign-in to work end-to-end.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <ol className="list-decimal space-y-3 pl-5">
            <li>
              Open{" "}
              <strong className="text-foreground">Supabase Dashboard → Authentication → Providers</strong>{" "}
              (Sign In / Providers).
            </li>
            <li>
              Enable <strong className="text-foreground">Google</strong> and/or{" "}
              <strong className="text-foreground">Facebook</strong>. Paste OAuth Client ID and
              Client Secret from Google Cloud Console / Meta for Developers.
            </li>
            <li>
              Under <strong className="text-foreground">URL Configuration</strong>, set Site URL to{" "}
              <code className="rounded bg-white/5 px-1 text-foreground">{appUrl}</code> and add
              redirect URLs:
              <ul className="mt-2 list-disc space-y-1 pl-5 font-mono text-xs text-foreground/90">
                <li>{appUrl}/auth/callback</li>
                <li>http://localhost:3000/auth/callback</li>
              </ul>
            </li>
            <li>
              In <code className="rounded bg-white/5 px-1">.env.local</code>, set flags only for
              providers you enabled in Supabase:
              <pre className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-foreground">
{`NEXT_PUBLIC_AUTH_PROVIDER_GOOGLE=true
NEXT_PUBLIC_AUTH_PROVIDER_FACEBOOK=true`}
              </pre>
            </li>
            <li>
              Restart the Next.js dev server after changing env vars. Provider names in code are{" "}
              <code className="rounded bg-white/5 px-1">google</code> and{" "}
              <code className="rounded bg-white/5 px-1">facebook</code> (see{" "}
              <code className="rounded bg-white/5 px-1">signInWithOAuth</code>).
            </li>
          </ol>
          <p>
            Callback route:{" "}
            <Link href="/auth/callback" className="text-violet-400 hover:underline">
              /auth/callback
            </Link>{" "}
            exchanges the auth code for a session and redirects to onboarding or the dashboard.
          </p>
          <a
            href={supabaseAuthProvidersUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-violet-400 hover:underline"
          >
            Open Supabase Auth providers
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
