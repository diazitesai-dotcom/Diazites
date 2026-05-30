import Link from "next/link";

import { AUTH_BRAND, DEFAULT_TRIAL_DAYS_SIGNUP } from "@/lib/auth/auth-branding";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function TrialWelcomeBanner() {
  return (
    <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-500/15 to-cyan-500/10 px-5 py-4">
      <p className="text-lg font-semibold text-violet-100">
        Welcome to {AUTH_BRAND.platformName}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Your <strong className="text-foreground">{DEFAULT_TRIAL_DAYS_SIGNUP}-day free trial</strong>{" "}
        starts when you finish setup below. Full platform access — upgrade anytime from Organization →
        Billing.
      </p>
      <Link
        href="/dashboard/organization?tab=billing"
        className={cn(buttonVariants({ size: "sm", variant: "outline" }), "mt-3 rounded-lg")}
      >
        View plans & upgrade
      </Link>
    </div>
  );
}
