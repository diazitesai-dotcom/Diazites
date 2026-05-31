"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { CreditCard, Loader2 } from "lucide-react";

import { validatePromoCodePublicAction } from "@/actions/promo.actions";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { AUTH_BRAND, DEFAULT_TRIAL_DAYS_SIGNUP } from "@/lib/auth/auth-branding";
import { SIGNUP_TRIAL_PLANS, normalizeSignupPlan } from "@/lib/billing/signup-plans";
import type { BillingPlanName } from "@/types/backend";
import { cn } from "@/lib/utils";

type TrialSignupWizardProps = {
  action: (formData: FormData) => Promise<void>;
  initialStep?: 1 | 2;
  initialPlan?: BillingPlanName;
  nextPath?: string;
};

export function TrialSignupWizard({
  action,
  initialStep = 1,
  initialPlan = "Starter",
  nextPath = "/onboarding?welcome=trial",
}: TrialSignupWizardProps) {
  const [step, setStep] = useState<1 | 2>(initialStep);
  const [companyName, setCompanyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<BillingPlanName>(
    normalizeSignupPlan(initialPlan),
  );
  const [promoCode, setPromoCode] = useState("");
  const [promoMessage, setPromoMessage] = useState("");
  const [promoValid, setPromoValid] = useState(false);
  const [consent, setConsent] = useState(true);
  const [stepError, setStepError] = useState<string | null>(null);
  const [promoPending, startPromoTransition] = useTransition();

  const plan = SIGNUP_TRIAL_PLANS.find((p) => p.id === selectedPlan) ?? SIGNUP_TRIAL_PLANS[0]!;

  function validateStep1(): boolean {
    if (!companyName.trim()) {
      setStepError("Company name is required.");
      return false;
    }
    if (!fullName.trim()) {
      setStepError("Full name is required.");
      return false;
    }
    if (!email.trim()) {
      setStepError("Email address is required.");
      return false;
    }
    setStepError(null);
    return true;
  }

  function goToStep2() {
    if (!validateStep1()) return;
    setStep(2);
  }

  function checkPromo(code: string) {
    setPromoCode(code);
    if (!code.trim()) {
      setPromoMessage("");
      setPromoValid(false);
      return;
    }
    startPromoTransition(async () => {
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
    <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl shadow-slate-900/10">
      <div className="border-b border-slate-100 px-6 py-5">
        <h1 className="text-center text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          Start Your {DEFAULT_TRIAL_DAYS_SIGNUP} Day Free Trial Today!
        </h1>
      </div>

      <div className="grid grid-cols-2 border-b-2 border-blue-600 text-center text-sm font-semibold">
        <button
          type="button"
          onClick={() => setStep(1)}
          className={cn(
            "relative px-4 py-3 transition-colors",
            step === 1 ? "text-blue-600" : "text-slate-400 hover:text-slate-600",
          )}
        >
          Step 1
          <span className="mt-0.5 block text-xs font-normal">Tell Us About Your Business</span>
          {step === 1 ? (
            <span className="absolute bottom-0 left-1/2 h-0 w-0 -translate-x-1/2 translate-y-full border-x-8 border-t-8 border-x-transparent border-t-blue-600" />
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => (validateStep1() ? setStep(2) : undefined)}
          className={cn(
            "relative border-l border-slate-100 px-4 py-3 transition-colors",
            step === 2 ? "text-blue-600" : "text-slate-400 hover:text-slate-600",
          )}
        >
          Step 2
          <span className="mt-0.5 block text-xs font-normal">Trial Details</span>
          {step === 2 ? (
            <span className="absolute bottom-0 left-1/2 h-0 w-0 -translate-x-1/2 translate-y-full border-x-8 border-t-8 border-x-transparent border-t-blue-600" />
          ) : null}
        </button>
      </div>

      <div className="px-6 py-6">
        {step === 2 ? (
          <button
            type="button"
            onClick={() => setStep(1)}
            className="mb-4 text-xs font-medium text-blue-600 hover:underline"
          >
            ← Go Back to Step 1
          </button>
        ) : null}

        {stepError ? (
          <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {stepError}
          </p>
        ) : null}

        {step === 1 ? (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Company Name.."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none ring-blue-500 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2"
              autoComplete="organization"
            />
            <input
              type="text"
              placeholder="Full Name..."
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none ring-blue-500 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2"
              autoComplete="name"
            />
            <input
              type="email"
              placeholder="Email Address..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none ring-blue-500 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2"
              autoComplete="email"
            />
            <input
              type="tel"
              placeholder="Phone Number..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none ring-blue-500 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2"
              autoComplete="tel"
            />

            <button
              type="button"
              onClick={goToStep2}
              className="w-full rounded-lg bg-blue-600 py-3.5 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Go To Step #2
            </button>

            <p className="text-center text-xs text-slate-500">
              Receive updates, news, and offers via email and text.
            </p>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400">or continue with</span>
              </div>
            </div>

            <SocialAuthButtons mode="signup" nextPath={nextPath} promoCode={promoCode} />

            <p className="text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-blue-600 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        ) : (
          <form action={action} className="space-y-5">
            <input type="hidden" name="company_name" value={companyName} />
            <input type="hidden" name="full_name" value={fullName} />
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="phone" value={phone} />
            <input type="hidden" name="selected_plan" value={selectedPlan} />
            <input type="hidden" name="promo_code" value={promoCode} />

            <div className="overflow-hidden rounded-lg border border-slate-200">
              <div className="grid grid-cols-[1fr_auto] border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>Item</span>
                <span>Price</span>
              </div>
              <div className="divide-y divide-slate-100">
                {SIGNUP_TRIAL_PLANS.map((p) => (
                  <label
                    key={p.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50",
                      selectedPlan === p.id && "bg-blue-50/60",
                    )}
                  >
                    <input
                      type="radio"
                      name="plan_radio"
                      checked={selectedPlan === p.id}
                      onChange={() => setSelectedPlan(p.id)}
                      className="mt-1 accent-blue-600"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900">
                          ${p.priceMonthly} {p.label}
                        </span>
                        {p.recommended ? (
                          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-blue-700">
                            Popular
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {p.trialDays} Day Free Trial then ${p.priceMonthly}/month
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Payment Information
              </p>
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
                <CreditCard className="size-5 shrink-0 text-slate-400" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-600">Card secured via Stripe on the next screen</p>
                  <p className="text-xs text-slate-400">
                    You won&apos;t be charged until your {plan.trialDays}-day trial ends.
                  </p>
                </div>
                <span className="shrink-0 rounded-md bg-emerald-700 px-2 py-1 text-[10px] font-semibold text-white">
                  Stripe
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                Create password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none ring-blue-500 focus:border-blue-500 focus:ring-2"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="promo_code" className="text-sm font-medium text-slate-700">
                Promo code (optional)
              </label>
              <input
                id="promo_code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                onBlur={(e) => checkPromo(e.target.value)}
                placeholder="DIAZ60, FOUNDERS30…"
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none ring-blue-500 focus:border-blue-500 focus:ring-2"
              />
              {promoMessage ? (
                <p className={`text-xs ${promoValid ? "text-emerald-600" : "text-amber-600"}`}>
                  {promoMessage}
                </p>
              ) : null}
              {promoPending ? (
                <p className="flex items-center gap-1 text-xs text-slate-500">
                  <Loader2 className="size-3 animate-spin" /> Checking code…
                </p>
              ) : null}
            </div>

            <div className="rounded-lg border border-slate-200 px-4 py-3">
              <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                Order Summary
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{plan.label}</span>
                <span className="font-semibold text-slate-900">
                  ${plan.priceMonthly}/mo after trial
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                <span>{plan.trialDays}-day free trial</span>
                <span className="font-medium text-emerald-600">$0.00 today</span>
              </div>
            </div>

            <label className="flex items-start gap-2 text-xs text-slate-500">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 accent-blue-600"
              />
              <span>
                I agree to {AUTH_BRAND.platformName}{" "}
                <Link href="/terms" className="text-blue-600 hover:underline">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </Link>
                , and consent to receive updates via email and text.
              </span>
            </label>

            <AuthSubmitButton
              label="Start My Free Trial"
              pendingLabel="Creating account…"
              disabled={!consent}
              className="w-full rounded-lg bg-blue-600 py-3.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            />
          </form>
        )}
      </div>
    </div>
  );
}
