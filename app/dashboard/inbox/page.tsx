import { GrowthModulePage } from "@/components/layout/growth-module-page";

export default function InboxPage() {
  return (
    <GrowthModulePage
      eyebrow="Inbox"
      title="Unified inbox"
      description="SMS replies, email replies, lead messages, missed calls, and AI conversation history."
      purposeTitle="AI Chat Assistant"
      purposeDescription="Command agents and review threads from one inbox — wired in Phase 2."
      phase={2}
      primaryHref="/dashboard/leads"
      primaryLabel="Leads OS"
    />
  );
}
