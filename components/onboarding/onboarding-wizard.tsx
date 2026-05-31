"use client";

import { useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CAMPAIGN_GOALS } from "@/lib/platform/growth-spec";
import {
  emptyOnboardingDraft,
  type OnboardingAccountIntent,
  type OnboardingDraft,
} from "@/lib/onboarding/draft";
import {
  completeOnboardingFromDraftAction,
  saveOnboardingDraftAction,
} from "@/services/onboarding/actions";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "business", title: "Business", description: "Company identity & contact" },
  { id: "market", title: "Market", description: "Services, audience & offer" },
  { id: "brand", title: "Brand & goals", description: "Tone, budget & campaign goal" },
  { id: "notify", title: "Notifications", description: "Lead alerts & review" },
] as const;

const ACCOUNT_INTENTS: Array<{
  value: OnboardingAccountIntent;
  label: string;
  description: string;
}> = [
  {
    value: "direct",
    label: "Direct business",
    description: "You run one brand and want Mission Control for your own leads.",
  },
  {
    value: "agency",
    label: "Agency / multi-client",
    description: "You manage client sub-accounts and white-label workspaces.",
  },
  {
    value: "sub_account",
    label: "Client sub-account",
    description: "Your agency invited you — use their link instead of self-serve setup.",
  },
];

export function OnboardingWizard({ initialDraft }: { initialDraft?: OnboardingDraft }) {
  const [draft, setDraft] = useState<OnboardingDraft>(
    initialDraft ?? emptyOnboardingDraft(),
  );
  const [step, setStep] = useState(initialDraft?.wizardStep ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canBack = step > 0;
  const isLast = step === STEPS.length - 1;
  const isAgency = draft.accountIntent === "agency";
  const isSubAccount = draft.accountIntent === "sub_account";

  function patch(partial: Partial<OnboardingDraft>) {
    setDraft((current) => ({ ...current, ...partial }));
  }

  async function persistDraft(nextStep: number) {
    const payload = { ...draft, wizardStep: nextStep };
    const result = await saveOnboardingDraftAction(payload);
    if (!result.success) {
      setError(result.error ?? "Could not save progress");
      return false;
    }
    setError(null);
    setDraft(payload);
    return true;
  }

  function handleContinue() {
    startTransition(async () => {
      const nextStep = Math.min(STEPS.length - 1, step + 1);
      const saved = await persistDraft(nextStep);
      if (saved) setStep(nextStep);
    });
  }

  function handleBack() {
    const prev = Math.max(0, step - 1);
    setStep(prev);
    void persistDraft(prev);
  }

  function handleStepJump(target: number) {
    startTransition(async () => {
      const saved = await persistDraft(target);
      if (saved) setStep(target);
    });
  }

  function handleComplete() {
    startTransition(async () => {
      setError(null);
      await completeOnboardingFromDraftAction({ ...draft, wizardStep: step });
    });
  }

  const stepDescription =
    step === 0 && isAgency
      ? "Agency identity — we'll register your workspace for client sub-accounts after launch."
      : STEPS[step].description;

  return (
    <Card className="border-white/[0.06] shadow-[0_24px_80px_-48px_rgba(99,102,241,0.35)]">
      <CardHeader>
        <div className="flex flex-wrap gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              disabled={isPending}
              onClick={() => handleStepJump(i)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-left text-xs transition-colors",
                i === step
                  ? "border-violet-500/40 bg-violet-500/15 text-violet-100"
                  : "border-white/[0.08] text-muted-foreground hover:border-white/15",
              )}
            >
              <span className="font-semibold">{s.title}</span>
            </button>
          ))}
        </div>
        <CardTitle className="pt-2 text-lg">{STEPS[step].title}</CardTitle>
        <CardDescription>{stepDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {error ? (
            <p role="alert" className="rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-100">
              {error}
            </p>
          ) : null}

          {step === 0 ? (
            <StepBusiness draft={draft} patch={patch} />
          ) : null}
          {step === 1 ? <StepMarket draft={draft} patch={patch} /> : null}
          {step === 2 ? <StepBrand draft={draft} patch={patch} /> : null}
          {step === 3 ? <StepNotify draft={draft} patch={patch} isAgency={isAgency} /> : null}

          {isSubAccount ? (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
              Sub-accounts are provisioned by your agency. Switch to Direct business or Agency if
              you are setting up your own workspace.
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-4">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={!canBack || isPending}
              onClick={handleBack}
            >
              <ChevronLeft className="mr-1 size-4" />
              Back
            </Button>
            {isLast ? (
              <Button
                type="button"
                variant="gradient"
                className="rounded-xl px-8"
                disabled={isPending || isSubAccount}
                onClick={handleComplete}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Launching…
                  </>
                ) : isAgency ? (
                  "Launch agency workspace"
                ) : (
                  "Launch command center"
                )}
              </Button>
            ) : (
              <Button
                type="button"
                variant="gradient"
                className="rounded-xl px-8"
                disabled={isPending}
                onClick={handleContinue}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    Continue
                    <ChevronRight className="ml-1 size-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  className,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  className?: string;
  placeholder?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      <Input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function StepBusiness({
  draft,
  patch,
}: {
  draft: OnboardingDraft;
  patch: (partial: Partial<OnboardingDraft>) => void;
}) {
  const isAgency = draft.accountIntent === "agency";

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>Account type</Label>
        <div className="grid gap-2 sm:grid-cols-3">
          {ACCOUNT_INTENTS.map((intent) => (
            <button
              key={intent.value}
              type="button"
              onClick={() => patch({ accountIntent: intent.value })}
              className={cn(
                "rounded-xl border px-3 py-3 text-left text-xs transition-colors",
                draft.accountIntent === intent.value
                  ? "border-violet-500/40 bg-violet-500/15"
                  : "border-white/[0.08] hover:border-white/15",
              )}
            >
              <span className="block font-semibold text-foreground">{intent.label}</span>
              <span className="mt-1 block text-muted-foreground">{intent.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label={isAgency ? "Agency / brand name" : "Business name"}
          value={draft.businessName}
          onChange={(businessName) => patch({ businessName })}
          required
        />
        <Field
          label="Owner name"
          value={draft.ownerName}
          onChange={(ownerName) => patch({ ownerName })}
          required
        />
        <Field
          label="Business email"
          type="email"
          value={draft.businessEmail}
          onChange={(businessEmail) => patch({ businessEmail })}
        />
        <Field
          label="Login email"
          type="email"
          value={draft.email}
          onChange={(email) => patch({ email })}
          required
        />
        <Field label="Phone number" value={draft.phone} onChange={(phone) => patch({ phone })} />
        <Field label="Website URL" value={draft.website} onChange={(website) => patch({ website })} />
        <Field
          label="Business address"
          className="md:col-span-2"
          value={draft.businessAddress}
          onChange={(businessAddress) => patch({ businessAddress })}
        />
        <Field
          label="Service areas"
          value={draft.serviceArea}
          onChange={(serviceArea) => patch({ serviceArea })}
        />
        <Field
          label="City / state"
          value={draft.cityState}
          onChange={(cityState) => patch({ cityState })}
        />
        <Field
          label="Business hours"
          value={draft.businessHours}
          onChange={(businessHours) => patch({ businessHours })}
        />
        <Field
          label="Industry"
          value={draft.industry}
          onChange={(industry) => patch({ industry })}
        />
        {draft.accountIntent === "direct" ? (
          <Field
            label="Business type"
            value={draft.businessType}
            onChange={(businessType) => patch({ businessType })}
          />
        ) : null}
      </div>
    </div>
  );
}

function StepMarket({
  draft,
  patch,
}: {
  draft: OnboardingDraft;
  patch: (partial: Partial<OnboardingDraft>) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2">
        <Label>Main services</Label>
        <Textarea
          rows={3}
          placeholder="List primary services you sell"
          value={draft.services}
          onChange={(e) => patch({ services: e.target.value })}
        />
      </div>
      <Field
        label="Target audience"
        className="md:col-span-2"
        value={draft.targetAudience}
        onChange={(targetAudience) => patch({ targetAudience })}
      />
      <Field
        label="Ideal customer"
        className="md:col-span-2"
        value={draft.idealCustomer}
        onChange={(idealCustomer) => patch({ idealCustomer })}
      />
      <Field
        label="Offer / promotion"
        className="md:col-span-2"
        value={draft.offerPromotion}
        onChange={(offerPromotion) => patch({ offerPromotion })}
      />
      <Field
        label="Existing website (if different)"
        value={draft.existingWebsite}
        onChange={(existingWebsite) => patch({ existingWebsite })}
      />
      <Field
        label="Existing CRM"
        value={draft.existingCrm}
        onChange={(existingCrm) => patch({ existingCrm })}
      />
    </div>
  );
}

function StepBrand({
  draft,
  patch,
}: {
  draft: OnboardingDraft;
  patch: (partial: Partial<OnboardingDraft>) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field
        label="Monthly ad budget ($)"
        type="number"
        value={draft.monthlyBudget}
        onChange={(monthlyBudget) => patch({ monthlyBudget })}
      />
      <div className="space-y-2">
        <Label htmlFor="campaign_goal">Campaign goal</Label>
        <select
          id="campaign_goal"
          className="w-full rounded-lg border border-white/10 bg-background px-3 py-2 text-sm"
          value={draft.campaignGoal}
          onChange={(e) =>
            patch({ campaignGoal: e.target.value as OnboardingDraft["campaignGoal"] })
          }
        >
          {CAMPAIGN_GOALS.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>
      </div>
      <Field
        label="Brand tone"
        placeholder="Professional, friendly, bold…"
        value={draft.brandTone}
        onChange={(brandTone) => patch({ brandTone })}
      />
      <Field
        label="Brand colors"
        placeholder="#0f172a, #8b5cf6"
        value={draft.brandColors}
        onChange={(brandColors) => patch({ brandColors })}
      />
      <p className="text-xs text-muted-foreground md:col-span-2">
        Logo upload connects after onboarding via Business Setup → Brand Settings (Supabase Storage).
      </p>
    </div>
  );
}

function StepNotify({
  draft,
  patch,
  isAgency,
}: {
  draft: OnboardingDraft;
  patch: (partial: Partial<OnboardingDraft>) => void;
  isAgency: boolean;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field
        label="Lead notification email"
        type="email"
        value={draft.leadNotifyEmail}
        onChange={(leadNotifyEmail) => patch({ leadNotifyEmail })}
      />
      <Field
        label="Lead notification phone"
        value={draft.leadNotifyPhone}
        onChange={(leadNotifyPhone) => patch({ leadNotifyPhone })}
      />
      <p className="text-sm text-muted-foreground md:col-span-2">
        {isAgency
          ? "After launch you can add client sub-accounts from Platform accounts (admin) or your agency hub. Agents will not spend budget without approval unless you enable Full Auto-Execute."
          : "Next: connect ad accounts, activate AI agents, and approve your first campaigns from Mission Control. Agents will not spend budget or go live without your approval unless you enable Full Auto-Execute per agent."}
      </p>
    </div>
  );
}
