"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Loader2, ShoppingCart } from "lucide-react";

import {
  completeTrialSignupWithPaymentAction,
  createSignupSetupIntentAction,
} from "@/actions/signup-trial.actions";
import { validatePromoCodePublicAction } from "@/actions/promo.actions";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import {
  PaymentLoadingPlaceholder,
  TrialSignupPaymentElement,
  TrialSignupStripeProvider,
  useTrialSignupPaymentConfirm,
} from "@/components/auth/trial-signup-payment";
import { AUTH_BRAND, DEFAULT_TRIAL_DAYS_SIGNUP } from "@/lib/auth/auth-branding";
import { SIGNUP_TRIAL_PLANS, normalizeSignupPlan } from "@/lib/billing/signup-plans";
import type { BillingPlanName } from "@/types/backend";
import { cn } from "@/lib/utils";

type TrialSignupWizardProps = {
  action: (formData: FormData) => Promise<void>;
  initialStep?: 1 | 2;
  initialPlan?: BillingPlanName;
  nextPath?: string;
  stripeEnabled?: boolean;
  stripePublishableKey?: string | null;
};

export function TrialSignupWizard({
  action: _action,
  initialStep = 1,
  initialPlan = "Starter",
  nextPath = "/onboarding?welcome=trial",
  stripeEnabled = false,
  stripePublishableKey = null,
}: TrialSignupWizardProps) {
  const [step, setStep] = useState<1 | 2>(initialStep);
  const [companyName, setCompanyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [stepError, setStepError] = useState<string | null>(null);

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
    if (password.length < 8) {
      setStepError("Password must be at least 8 characters.");
      return false;
    }
    setStepError(null);
    return true;
  }

  function goToStep2() {
    if (!validateStep1()) return;
    if (stripeEnabled && !stripePublishableKey) {
      setStepError("Payment setup is incomplete. Please contact support.");
      return;
    }
    setStep(2);
  }

  const cardRequired = stripeEnabled && Boolean(stripePublishableKey);

  return (
    <div className="w-full max-w-lg overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-900 shadow-xl">
      <div className="border-b border-slate-100 px-6 py-5">
        <h1 className="text-center text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          Start Your {DEFAULT_TRIAL_DAYS_SIGNUP} Day Free Trial Today!
        </h1>
      </div>

      <div className="grid grid-cols-2 border-b-2 border-sky-500 text-center text-sm font-semibold">
        <StepTab active={step === 1} onClick={() => setStep(1)}>
          Step 1
          <span className="mt-0.5 block text-xs font-normal">Tell Us About Your Business</span>
        </StepTab>
        <StepTab active={step === 2} onClick={() => (validateStep1() ? setStep(2) : undefined)} bordered>
          Step 2
          <span className="mt-0.5 block text-xs font-normal">Trial Details</span>
        </StepTab>
      </div>

      <div className="px-6 py-6">
        {step === 2 ? (
          <button
            type="button"
            onClick={() => setStep(1)}
            className="mb-4 text-xs font-medium text-sky-600 hover:underline"
          >
            ← Go Back to Step 1
          </button>
        ) : null}

        {stepError ? (
          <p
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {stepError}
          </p>
        ) : null}

        {step === 1 ? (
          <StepOne
            companyName={companyName}
            setCompanyName={setCompanyName}
            fullName={fullName}
            setFullName={setFullName}
            email={email}
            setEmail={setEmail}
            phone={phone}
            setPhone={setPhone}
            password={password}
            setPassword={setPassword}
            promoCode={promoCode}
            setPromoCode={setPromoCode}
            onContinue={goToStep2}
            nextPath={nextPath}
            cardRequired={cardRequired}
          />
        ) : cardRequired ? (
          <StepTwoWithStripe
            companyName={companyName}
            fullName={fullName}
            email={email}
            phone={phone}
            password={password}
            promoCode={promoCode}
            initialPlan={initialPlan}
            publishableKey={stripePublishableKey!}
            onError={setStepError}
          />
        ) : (
          <StepTwoPaymentRequired />
        )}
      </div>
    </div>
  );
}

function StepTab({
  active,
  onClick,
  bordered,
  children,
}: {
  active: boolean;
  onClick: () => void;
  bordered?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative px-4 py-3 transition-colors",
        bordered && "border-l border-slate-100",
        active ? "text-sky-600" : "text-slate-400 hover:text-slate-600",
      )}
    >
      {children}
      {active ? (
        <span className="absolute bottom-0 left-1/2 h-0 w-0 -translate-x-1/2 translate-y-full border-x-8 border-t-8 border-x-transparent border-t-sky-500" />
      ) : null}
    </button>
  );
}

function StepOne({
  companyName,
  setCompanyName,
  fullName,
  setFullName,
  email,
  setEmail,
  phone,
  setPhone,
  password,
  setPassword,
  promoCode,
  setPromoCode,
  onContinue,
  nextPath,
  cardRequired,
}: {
  companyName: string;
  setCompanyName: (v: string) => void;
  fullName: string;
  setFullName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  promoCode: string;
  setPromoCode: (v: string) => void;
  onContinue: () => void;
  nextPath: string;
  cardRequired: boolean;
}) {
  const [promoMessage, setPromoMessage] = useState("");
  const [promoValid, setPromoValid] = useState(false);
  const [promoPending, startPromoTransition] = useTransition();

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
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Company Name.."
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-4 py-3 text-sm outline-none ring-sky-500 placeholder:text-slate-400 focus:border-sky-500 focus:ring-1"
        autoComplete="organization"
      />
      <input
        type="text"
        placeholder="Full Name..."
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-4 py-3 text-sm outline-none ring-sky-500 placeholder:text-slate-400 focus:border-sky-500 focus:ring-1"
        autoComplete="name"
      />
      <input
        type="email"
        placeholder="Email Address..."
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-4 py-3 text-sm outline-none ring-sky-500 placeholder:text-slate-400 focus:border-sky-500 focus:ring-1"
        autoComplete="email"
      />
      <input
        type="tel"
        placeholder="Phone Number..."
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-4 py-3 text-sm outline-none ring-sky-500 placeholder:text-slate-400 focus:border-sky-500 focus:ring-1"
        autoComplete="tel"
      />
      <input
        type="password"
        placeholder="Create Password (min. 8 characters)..."
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={8}
        className="w-full rounded-md border border-slate-300 px-4 py-3 text-sm outline-none ring-sky-500 placeholder:text-slate-400 focus:border-sky-500 focus:ring-1"
        autoComplete="new-password"
      />
      <input
        type="text"
        placeholder="Promo code (optional)..."
        value={promoCode}
        onChange={(e) => setPromoCode(e.target.value)}
        onBlur={(e) => checkPromo(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-4 py-3 text-sm outline-none ring-sky-500 placeholder:text-slate-400 focus:border-sky-500 focus:ring-1"
      />
      {promoMessage ? (
        <p className={`text-xs ${promoValid ? "text-emerald-600" : "text-amber-600"}`}>{promoMessage}</p>
      ) : null}
      {promoPending ? (
        <p className="flex items-center gap-1 text-xs text-slate-500">
          <Loader2 className="size-3 animate-spin" /> Checking code…
        </p>
      ) : null}

      <button
        type="button"
        onClick={onContinue}
        className="w-full rounded-md bg-sky-500 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-sky-600"
      >
        {cardRequired ? "Go To Step #2 — Add Payment" : "Go To Step #2"}
      </button>

      <p className="text-center text-xs text-slate-500">
        Receive updates, news, and offers via email and text.
        {cardRequired ? (
          <>
            {" "}
            A valid card is required on Step 2 to start your free trial.
          </>
        ) : null}
      </p>

      {!cardRequired ? (
        <>
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400">or continue with</span>
            </div>
          </div>
          <SocialAuthButtons mode="signup" nextPath={nextPath} promoCode={promoCode} />
        </>
      ) : null}

      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-sky-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

function StepTwoPaymentRequired() {
  return (
    <div className="space-y-4 text-center">
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Card payment is required to start your free trial. Billing is not configured yet — please
        contact{" "}
        <a href={`mailto:${AUTH_BRAND.supportEmail}`} className="font-medium underline">
          {AUTH_BRAND.supportEmail}
        </a>
        .
      </p>
      <Link href="/login" className="text-sm font-medium text-sky-600 hover:underline">
        Back to sign in
      </Link>
    </div>
  );
}

function StepTwoWithStripe({
  companyName,
  fullName,
  email,
  phone,
  password,
  promoCode,
  initialPlan,
  publishableKey,
  onError,
}: {
  companyName: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  promoCode: string;
  initialPlan: BillingPlanName;
  publishableKey: string;
  onError: (msg: string | null) => void;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingIntent, setLoadingIntent] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<BillingPlanName>(
    normalizeSignupPlan(initialPlan),
  );

  useEffect(() => {
    let cancelled = false;
    setLoadingIntent(true);
    onError(null);

    void (async () => {
      const result = await createSignupSetupIntentAction({
        email,
        fullName,
        companyName,
        planName: selectedPlan,
      });
      if (cancelled) return;
      if (!result.success) {
        onError(result.error);
        setClientSecret(null);
      } else {
        setClientSecret(result.data.clientSecret);
      }
      setLoadingIntent(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [email, fullName, companyName, selectedPlan, onError]);

  if (loadingIntent || !clientSecret) {
    return (
      <div className="space-y-5">
        <PlanPicker selectedPlan={selectedPlan} onSelect={setSelectedPlan} />
        <PaymentSectionShell>
          <PaymentLoadingPlaceholder />
        </PaymentSectionShell>
      </div>
    );
  }

  return (
    <TrialSignupStripeProvider publishableKey={publishableKey} clientSecret={clientSecret}>
      <StepTwoStripeForm
        companyName={companyName}
        fullName={fullName}
        email={email}
        phone={phone}
        password={password}
        promoCode={promoCode}
        selectedPlan={selectedPlan}
        onSelectPlan={setSelectedPlan}
        onError={onError}
      />
    </TrialSignupStripeProvider>
  );
}

function StepTwoStripeForm({
  companyName,
  fullName,
  email,
  phone,
  password,
  promoCode,
  selectedPlan,
  onSelectPlan,
  onError,
}: {
  companyName: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  promoCode: string;
  selectedPlan: BillingPlanName;
  onSelectPlan: (plan: BillingPlanName) => void;
  onError: (msg: string | null) => void;
}) {
  const plan = SIGNUP_TRIAL_PLANS.find((p) => p.id === selectedPlan) ?? SIGNUP_TRIAL_PLANS[0]!;
  const [consent, setConsent] = useState(true);
  const [paymentReady, setPaymentReady] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { confirmPayment, stripeReady } = useTrialSignupPaymentConfirm({
    email,
    name: fullName,
    country: "US",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onError(null);

    if (!consent) {
      onError("Please accept the terms to continue.");
      return;
    }

    if (!paymentComplete) {
      onError("Please enter your card information to continue.");
      return;
    }

    startTransition(async () => {
      try {
        const payment = await confirmPayment();
        if (!payment.success) {
          onError(payment.error);
          return;
        }

        const result = await completeTrialSignupWithPaymentAction({
          companyName,
          fullName,
          email,
          phone,
          password,
          selectedPlan,
          promoCode,
          setupIntentId: payment.setupIntentId,
        });

        if (!result.success) {
          onError(result.error);
          return;
        }

        // Full navigation avoids broken redirects when the action is called from a transition.
        window.location.assign(result.redirectTo);
      } catch (err) {
        onError(
          err instanceof Error
            ? err.message
            : "Something went wrong completing signup. Please try again.",
        );
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PlanPicker selectedPlan={selectedPlan} onSelect={onSelectPlan} />

      <PaymentSectionShell>
        <TrialSignupPaymentElement
          onReadyChange={setPaymentReady}
          onCompleteChange={setPaymentComplete}
        />
      </PaymentSectionShell>

      <OrderSummary plan={plan} />

      <label className="flex items-start gap-2 text-xs text-slate-600">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 accent-sky-500"
        />
        <span>
          By signing up, you agree to {AUTH_BRAND.productName}&apos;s{" "}
          <Link href="/terms" className="text-sky-600 underline hover:text-sky-700">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-sky-600 underline hover:text-sky-700">
            Privacy Policy
          </Link>
          .
        </span>
      </label>

      <div className="space-y-2">
        <button
          type="submit"
          disabled={isPending || !consent || !paymentReady || !stripeReady || !paymentComplete}
          className="flex w-full flex-col items-center justify-center rounded-md bg-sky-500 px-4 py-3.5 text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? (
            <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
              <Loader2 className="size-4 animate-spin" />
              Starting trial…
            </span>
          ) : (
            <>
              <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
                <ShoppingCart className="size-4" aria-hidden />
                Start Your {plan.trialDays} Day Free Trial!
              </span>
              <span className="mt-1 text-[11px] font-normal normal-case tracking-normal opacity-90">
                After the {plan.trialDays} days, you will be billed with the card on file.
              </span>
            </>
          )}
        </button>
        <p className="text-center text-xs text-slate-400">* 100% Secure &amp; Safe *</p>
      </div>
    </form>
  );
}

function PlanPicker({
  selectedPlan,
  onSelect,
}: {
  selectedPlan: BillingPlanName;
  onSelect: (plan: BillingPlanName) => void;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200">
      <div className="grid grid-cols-[1fr_auto] border-b border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700">
        <span>Item</span>
        <span>Price</span>
      </div>
      <div className="divide-y divide-slate-100 bg-white">
        {SIGNUP_TRIAL_PLANS.map((p) => (
          <label
            key={p.id}
            className={cn(
              "grid cursor-pointer grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50",
              selectedPlan === p.id && "bg-sky-50/70",
            )}
          >
            <span className="flex items-center gap-3">
              <input
                type="radio"
                name="plan_radio"
                checked={selectedPlan === p.id}
                onChange={() => onSelect(p.id)}
                className="accent-sky-500"
              />
              <span className="font-semibold text-slate-900">
                ${p.priceMonthly} {p.label}
              </span>
            </span>
            <span className="text-right text-xs text-slate-600 sm:text-sm">
              {p.trialDays} Day Free Trial then ${p.priceMonthly}/month
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function PaymentSectionShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-sky-100 bg-[#eef6fc] px-4 py-4">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-sky-800">
        Payment Information
      </p>
      {children}
    </div>
  );
}

function OrderSummary({ plan }: { plan: (typeof SIGNUP_TRIAL_PLANS)[number] }) {
  return (
    <div className="space-y-3">
      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Order Summary
          </span>
        </div>
      </div>
      <div className="overflow-hidden rounded-md border border-slate-200">
        <div className="grid grid-cols-[1fr_auto] border-b border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700">
          <span>Item</span>
          <span>Amount</span>
        </div>
        <div className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 text-sm">
          <span className="font-semibold text-slate-900">
            ${plan.priceMonthly} {plan.label}
          </span>
          <span className="text-right text-xs text-slate-600 sm:text-sm">
            {plan.trialDays} Day Free Trial then ${plan.priceMonthly}/month
          </span>
        </div>
      </div>
    </div>
  );
}
