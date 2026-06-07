"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Rocket,
  Scan,
  Sparkles,
} from "lucide-react";

import { scanBusinessProfileAction } from "@/actions/ceo-onboarding.actions";
import { ProgressTracker } from "@/components/ceo-command-center/progress-tracker";
import { FIELD_LABELS } from "@/lib/ceo-command-center/business-profile-autofill";
import { cn } from "@/lib/utils";
import type {
  BusinessProfileFields,
  OnboardingCommandCenterData,
  OnboardingStepId,
} from "@/types/ceo-command-center";

type OnboardingCommandCenterProps = {
  initialData: OnboardingCommandCenterData;
};

const STEP_ORDER: OnboardingStepId[] = [
  "business_profile",
  "offer_goals",
  "landing_pages",
  "pipeline_workflow",
  "connect_accounts",
  "ai_agents",
  "ads_agent",
  "tracking",
  "review",
  "launch",
];

function stepToProgressStatus(
  stepId: OnboardingStepId,
  currentIndex: number,
  stepIndex: number,
): "completed" | "active" | "review" | "pending" {
  if (stepIndex < currentIndex) return "completed";
  if (stepIndex === currentIndex) {
    return stepId === "review" ? "review" : "active";
  }
  return "pending";
}

export function OnboardingCommandCenter({ initialData }: OnboardingCommandCenterProps) {
  const router = useRouter();
  const [currentStepId, setCurrentStepId] = useState<OnboardingStepId>(
    initialData.currentStepId,
  );
  const [profile, setProfile] = useState<BusinessProfileFields>(initialData.businessProfile);
  const [websiteUrl, setWebsiteUrl] = useState(initialData.businessProfile.website || "");
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [isScanPending, startScanTransition] = useTransition();
  const [selectedLandingId, setSelectedLandingId] = useState<string | null>("lead_gen");

  const [integrations, setIntegrations] = useState(initialData.integrations);

  const currentIndex = STEP_ORDER.indexOf(currentStepId);
  const progressSteps = initialData.steps.map((step, index) => ({
    id: step.number,
    label: step.label,
    status: stepToProgressStatus(step.id, currentIndex, index),
  }));

  const goNext = () => {
    const next = STEP_ORDER[currentIndex + 1];
    if (next) setCurrentStepId(next);
  };

  const goPrev = () => {
    const prev = STEP_ORDER[currentIndex - 1];
    if (prev) setCurrentStepId(prev);
  };

  const handleScanBusiness = () => {
    const url = websiteUrl.trim();
    if (!url) {
      setScanError("Enter your business website URL first.");
      setScanMessage(null);
      return;
    }

    setScanError(null);
    setScanMessage(null);

    startScanTransition(async () => {
      const result = await scanBusinessProfileAction(url, profile);
      if (!result.success) {
        setScanError(result.error);
        return;
      }

      setProfile(result.data.profile);
      setWebsiteUrl(result.data.profile.website || url);
      setScanMessage(
        result.data.usedAi
          ? "AI filled in your business details — review and edit anything before continuing."
          : "We pulled basics from your site. Add OPENAI_API_KEY for richer AI autofill.",
      );
    });
  };

  const toggleIntegration = (id: string) => {
    setIntegrations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, connected: !item.connected } : item)),
    );
  };

  const handleLaunch = () => {
    router.push("/dashboard?onboarding=complete");
  };

  return (
    <div className="min-h-screen bg-[#050810] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.15),transparent)]" />

      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-bold tracking-[0.2em] text-white">DIAZITES</p>
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-violet-400/90">
              AI Business OS
            </p>
            <h1 className="mt-4 text-2xl font-semibold text-white">Onboarding Command Center</h1>
            <p className="mt-1 text-sm text-slate-400">
              Set up your AI business system in 10 guided steps.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-violet-300 hover:text-violet-200"
          >
            Skip to dashboard →
          </Link>
        </header>

        <ProgressTracker steps={progressSteps} />

        <div className="mt-8 rounded-2xl border border-white/[0.08] bg-[#0c1222]/80 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          {currentStepId === "business_profile" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Business Profile</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Enter your website and let AI fill in your business details.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleScanBusiness();
                    }
                  }}
                  placeholder="https://yourbusiness.com"
                  className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
                />
                <button
                  type="button"
                  onClick={handleScanBusiness}
                  disabled={isScanPending || !websiteUrl.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isScanPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Scanning…
                    </>
                  ) : (
                    <>
                      <Scan className="h-4 w-4" />
                      Scan Business
                    </>
                  )}
                </button>
              </div>
              {scanError ? (
                <p role="alert" className="text-sm text-rose-300">
                  {scanError}
                </p>
              ) : null}
              {scanMessage ? (
                <p role="status" className="text-sm text-emerald-300">
                  {scanMessage}
                </p>
              ) : null}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {(Object.keys(profile) as (keyof BusinessProfileFields)[]).map((key) => (
                  <label key={key} className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-400">
                      {FIELD_LABELS[key]}
                    </span>
                    <input
                      value={profile[key]}
                      onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white focus:border-violet-500/40 focus:outline-none"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {currentStepId === "offer_goals" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Offer & Goals</h2>
              <p className="text-sm text-slate-400">
                Define your primary offer and revenue targets for the AI system.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-400">Main Offer</span>
                  <input
                    defaultValue={profile.mainOffer}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-400">Monthly Revenue Goal</span>
                  <input
                    defaultValue="$50,000"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
                  />
                </label>
              </div>
            </div>
          )}

          {currentStepId === "landing_pages" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Landing Pages</h2>
              <p className="text-sm text-slate-400">Choose a landing page template to launch with.</p>
              <div className="grid gap-4 md:grid-cols-3">
                {initialData.landingPages.map((page) => (
                  <article
                    key={page.id}
                    className={cn(
                      "rounded-2xl border p-4 transition",
                      selectedLandingId === page.id
                        ? "border-violet-500/50 bg-violet-500/10"
                        : "border-white/[0.08] bg-white/[0.02]",
                    )}
                  >
                    <h3 className="font-semibold text-white">{page.title}</h3>
                    <p className="mt-2 text-xs text-slate-400">{page.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-slate-300">
                        Preview
                      </button>
                      <button type="button" className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-slate-300">
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedLandingId(page.id)}
                        className="rounded-lg bg-violet-600/30 px-2.5 py-1 text-xs font-medium text-violet-100"
                      >
                        Select
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {(currentStepId === "pipeline_workflow" || currentStepId === "ai_agents" || currentStepId === "tracking") && (
            <div className="space-y-4 py-8 text-center">
              <Sparkles className="mx-auto h-10 w-10 text-violet-400" />
              <h2 className="text-lg font-semibold capitalize text-white">
                {currentStepId.replace(/_/g, " ")}
              </h2>
              <p className="mx-auto max-w-md text-sm text-slate-400">
                AI is configuring your {currentStepId.replace(/_/g, " ")} based on your business profile.
                Click continue to proceed.
              </p>
            </div>
          )}

          {currentStepId === "connect_accounts" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Connect Accounts</h2>
              <p className="text-sm text-slate-400">Link your marketing, CRM, and payment tools.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {integrations.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-white">{item.name}</p>
                        {item.description ? (
                          <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleIntegration(item.id)}
                        className={cn(
                          "shrink-0 rounded-lg px-3 py-1 text-xs font-medium",
                          item.connected
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-violet-600/20 text-violet-200",
                        )}
                      >
                        {item.connected ? "Connected" : "Connect"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStepId === "ads_agent" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Ads Agent</h2>
              <p className="text-sm text-slate-400">
                Generate campaigns using your business profile, landing page, keywords, niche,
                location, offer, budget, and target customer.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  ["Niche", profile.industry],
                  ["Location", "Austin, TX"],
                  ["Offer", profile.mainOffer],
                  ["Budget", "$70/day"],
                  ["Target Customer", profile.targetCustomer],
                  ["Keywords", profile.keywords],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                  >
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="mt-1 text-sm text-white">{value}</p>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white"
              >
                <Sparkles className="h-4 w-4" />
                Generate Campaigns
              </button>
            </div>
          )}

          {currentStepId === "review" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Review</h2>
              <p className="text-sm text-slate-400">Confirm everything is ready before launch.</p>
              <ul className="space-y-2">
                {initialData.reviewChecklist.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full",
                        item.complete
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-white/5 text-slate-500",
                      )}
                    >
                      {item.complete ? <Check className="h-3.5 w-3.5" /> : "—"}
                    </span>
                    <span className={item.complete ? "text-slate-200" : "text-slate-500"}>
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {currentStepId === "launch" && (
            <div className="space-y-6 py-8 text-center">
              <Rocket className="mx-auto h-12 w-12 text-violet-400" />
              <h2 className="text-2xl font-semibold text-white">Ready to Launch</h2>
              <p className="mx-auto max-w-md text-sm text-slate-400">
                Your AI business system is configured. Launch to activate agents, campaigns, and
                automations.
              </p>
              <button
                type="button"
                onClick={handleLaunch}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-violet-900/40"
              >
                <Rocket className="h-5 w-5" />
                Launch My System
              </button>
              <p className="text-xs text-slate-500">
                After launch you&apos;ll be taken to{" "}
                <ExternalLink className="inline h-3 w-3" /> /dashboard
              </p>
            </div>
          )}

          {currentStepId !== "launch" && (
            <div className="mt-8 flex items-center justify-between border-t border-white/[0.06] pt-6">
              <button
                type="button"
                onClick={goPrev}
                disabled={currentIndex === 0}
                className="inline-flex items-center gap-1 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center gap-1 rounded-xl bg-violet-600/30 px-4 py-2 text-sm font-medium text-violet-100"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
