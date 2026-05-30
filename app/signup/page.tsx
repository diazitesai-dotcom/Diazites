import Link from "next/link";

import { SignupCard } from "@/components/auth/signup-card";
import { AUTH_BRAND } from "@/lib/auth/auth-branding";
import { buttonVariants } from "@/components/ui/button";
import { signupAction } from "@/services/auth/actions";
import { cn } from "@/lib/utils";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const rawError = sp.error;
  const rawSuccess = sp.success;
  const rawEmail = sp.email;
  const rawNext = sp.next;

  const safeDecode = (s: string) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  };

  const errorMsg = typeof rawError === "string" ? safeDecode(rawError) : null;
  const successType = typeof rawSuccess === "string" ? rawSuccess : null;
  const email = typeof rawEmail === "string" ? safeDecode(rawEmail) : null;
  const nextPath =
    typeof rawNext === "string" && rawNext.startsWith("/") ? rawNext : "/onboarding?welcome=trial";

  if (successType === "check-email") {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(139,92,246,0.2),transparent)]" />
        <div className="relative z-[1] w-full max-w-md space-y-6 rounded-2xl border border-white/[0.08] bg-card p-8 text-center shadow-[0_24px_80px_-48px_rgba(99,102,241,0.45)]">
          <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            We sent a confirmation link from <strong className="text-foreground">{AUTH_BRAND.platformName}</strong>
            {email ? (
              <>
                {" "}
                to <span className="text-violet-300">{email}</span>
              </>
            ) : (
              " to your inbox"
            )}
            . Click the link to activate your account and start your <strong>14-day free trial</strong>.
          </p>
          <p className="text-xs text-muted-foreground">
            Did not receive it? Check spam, or wait a minute and try signing up again.
          </p>
          <Link href="/login" className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}>
            Back to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(139,92,246,0.2),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_80%,rgba(34,211,238,0.12),transparent)]" />
      <div className="relative z-[1] w-full max-w-md space-y-4">
        {errorMsg ? (
          <p
            role="alert"
            className="rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-100"
          >
            {errorMsg}
          </p>
        ) : null}
        <SignupCard
          title={`Create your ${AUTH_BRAND.platformName} account`}
          submitText="Start free trial"
          pendingText="Creating account…"
          action={signupAction}
          footerHref="/login"
          footerText="Already have an account?"
          footerCta="Sign in"
          nextPath={nextPath}
        />
      </div>
    </main>
  );
}
