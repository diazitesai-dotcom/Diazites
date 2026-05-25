import { GrowthModulePage } from "@/components/layout/growth-module-page";

export default function FollowUpPage() {
  return (
    <GrowthModulePage
      eyebrow="Follow-up"
      title="SMS & email sequences"
      description="Automated text and email nurture, appointment reminders, and reply-aware sequence stops."
      purposeTitle="Twilio · Gmail · templates"
      purposeDescription="Phase 2 connects Twilio and Gmail; Phase 1 defines rules and templates UI shells."
      phase={2}
      primaryHref="/dashboard/automations"
      primaryLabel="Automation Center"
    />
  );
}
