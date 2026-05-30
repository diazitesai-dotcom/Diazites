"use client";

import Link from "next/link";

import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { AUTH_BRAND } from "@/lib/auth/auth-branding";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AuthCardProps {
  title: string;
  submitText: string;
  pendingText?: string;
  action: (formData: FormData) => Promise<void>;
  footerHref: string;
  footerText: string;
  footerCta: string;
  showPassword?: boolean;
  /** After sign-in, redirect here (validated server-side) */
  returnPath?: string;
}

export function AuthCard({
  title,
  submitText,
  pendingText = "Please wait…",
  action,
  footerHref,
  footerText,
  footerCta,
  showPassword = true,
  returnPath,
}: AuthCardProps) {
  return (
    <Card className="w-full max-w-md border-white/[0.08] shadow-[0_24px_80px_-48px_rgba(99,102,241,0.45)]">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl tracking-tight">{title}</CardTitle>
        <CardDescription>
          Sign in to {AUTH_BRAND.platformName} — email, Google, Facebook, Apple, or Microsoft.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SocialAuthButtons
          mode="login"
          nextPath={returnPath ?? "/dashboard"}
          className="mb-4"
        />
        <form className="space-y-4" action={action}>
          {returnPath ? <input type="hidden" name="next" value={returnPath} /> : null}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          {showPassword ? (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>
          ) : null}
          <AuthSubmitButton label={submitText} pendingLabel={pendingText} />
        </form>
        <p className="mt-4 text-sm text-muted-foreground">
          {footerText}{" "}
          <Link className="font-medium text-violet-400 underline-offset-4 hover:underline" href={footerHref}>
            {footerCta}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
