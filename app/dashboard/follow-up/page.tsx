import { GrowthModulePage } from "@/components/layout/growth-module-page";

export default function FollowUpPage() {
  return (
    <GrowthModulePage
      eyebrow="Follow-up"
      title="Email sequences"
      description="Automated email nurture, appointment reminders, and reply-aware sequence stops."
      purposeTitle="Gmail · templates"
      purposeDescription="Phase 2 connects Gmail and your ESP; Phase 1 defines rules and templates UI shells."
      phase={2}
      primaryHref="/dashboard/automations"
      primaryLabel="Automation Center"
    />
  );
}
