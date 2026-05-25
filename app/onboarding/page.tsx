import { PageHeader } from "@/components/layout/page-header";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { CORE_USER_FLOW } from "@/lib/platform/growth-spec";

export default function OnboardingPage() {
  return (
    <main className="relative min-h-screen px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_-10%,rgba(139,92,246,0.15),transparent)]" />
      <div className="relative mx-auto max-w-4xl space-y-10">
        <PageHeader
          eyebrow="Setup"
          title="Business onboarding wizard"
          description="Four steps to align agents, campaigns, CRM, and follow-up with your market — before you connect ad accounts and go live."
        />
        <OnboardingWizard />
        <details className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-muted-foreground">
          <summary className="cursor-pointer font-medium text-foreground">
            Core platform flow (19 steps)
          </summary>
          <ol className="mt-3 list-decimal space-y-1 pl-5">
            {CORE_USER_FLOW.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </details>
      </div>
    </main>
  );
}
