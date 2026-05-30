"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";

import { validatePromoCodePublicAction } from "@/actions/promo.actions";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { AUTH_BRAND, DEFAULT_TRIAL_DAYS_SIGNUP } from "@/lib/auth/auth-branding";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SignupCardProps {
  title: string;
  submitText: string;
  pendingText?: string;
  action: (formData: FormData) => Promise<void>;
  footerHref: string;
  footerText: string;
  footerCta: string;
  nextPath?: string;
}

const TRIAL_PERKS = [
  "Full CRM, pipelines & leads",
  "AI agents, workflows & funnels",
  "14 days free — upgrade anytime",
];

export function SignupCard({
  title,
  submitText,
  pendingText = "Please wait…",
  action,
  footerHref,
  footerText,
  footerCta,
  nextPath = "/onboarding?welcome=trial",
}: SignupCardProps) {
  const [promoMessage, setPromoMessage] = useState("");
  const [promoValid, setPromoValid] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [pending, startTransition] = useTransition();

  function checkPromo(code: string) {
    setPromoCode(code);
    if (!code.trim()) {
      setPromoMessage("");
      setPromoValid(false);
      return;
    }
    startTransition(async () => {
      const res = await validatePromoCodePublicAction(code);
      if (res.success) {
        setPromoMessage(res.data.message);
        setPromoValid(true);
      } else {
        setPromoMessage(res.error);
        setPromoValid(false);
      }
    });
  }

  return (
    <Card className="w-full max-w-md border-white/[0.08] shadow-[0_24px_80px_-48px_rgba(99,102,241,0.45)]">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl tracking-tight">{title}</CardTitle>
        <CardDescription>
          Start your {DEFAULT_TRIAL_DAYS_SIGNUP}-day free trial on {AUTH_BRAND.platformName}. No credit
          card required to begin.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-1.5 rounded-xl border border-violet-500/20 bg-violet-500/5 px-3 py-2.5 text-xs text-violet-100/90">
          {TRIAL_PERKS.map((perk) => (
            <li key={perk} className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              {perk}
            </li>
          ))}
        </ul>

        <SocialAuthButtons mode="signup" nextPath={nextPath} promoCode={promoCode} />

        <form className="space-y-4" action={action}>
          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input
              id="full_name"
              name="full_name"
              type="text"
              autoComplete="name"
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="promo_code">Promo code (optional)</Label>
            <Input
              id="promo_code"
              name="promo_code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              onBlur={(e) => checkPromo(e.target.value)}
              placeholder="DIAZ60, FOUNDERS30…"
            />
            {promoMessage ? (
              <p
                className={`text-xs ${promoValid ? "text-emerald-400" : "text-amber-400"}`}
              >
                {promoMessage}
              </p>
            ) : null}
            {pending ? (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Checking code…
              </p>
            ) : null}
          </div>
          <AuthSubmitButton label={submitText} pendingLabel={pendingText} />
        </form>
        <p className="text-center text-xs text-muted-foreground">
          By signing up you agree to our{" "}
          <Link href="/terms" className="text-violet-400 hover:underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-violet-400 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
        <p className="text-sm text-muted-foreground">
          {footerText}{" "}
          <Link
            className="font-medium text-violet-400 underline-offset-4 hover:underline"
            href={footerHref}
          >
            {footerCta}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
