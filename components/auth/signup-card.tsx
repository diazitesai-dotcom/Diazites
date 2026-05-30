"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validatePromoCodePublicAction } from "@/actions/promo.actions";

interface SignupCardProps {
  title: string;
  submitText: string;
  pendingText?: string;
  action: (formData: FormData) => Promise<void>;
  footerHref: string;
  footerText: string;
  footerCta: string;
}

export function SignupCard({
  title,
  submitText,
  pendingText = "Please wait…",
  action,
  footerHref,
  footerText,
  footerCta,
}: SignupCardProps) {
  const [promoMessage, setPromoMessage] = useState("");
  const [promoValid, setPromoValid] = useState(false);
  const [pending, startTransition] = useTransition();

  function checkPromo(code: string) {
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
          Start your 14-day free trial. Full AI business backend included.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" action={action}>
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
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="promo_code">Promo code (optional)</Label>
            <Input
              id="promo_code"
              name="promo_code"
              placeholder="DIAZ60, FOUNDERS30…"
              onBlur={(e) => checkPromo(e.target.value)}
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
        <p className="mt-4 text-sm text-muted-foreground">
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
