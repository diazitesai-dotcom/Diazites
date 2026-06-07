import { GrowthModulePage } from "@/components/layout/growth-module-page";

export default function CalendarPage() {
  return (
    <GrowthModulePage
      eyebrow="Automation"
      title="Appointments"
      description="Booking links, calendar sync, availability, and appointment reminders."
      purposeTitle="Appointment Agent"
      purposeDescription="Connect calendar in Settings when ready; booked leads sync to your pipeline."
      phase={2}
      primaryHref="/dashboard/leads"
      primaryLabel="View leads"
    />
  );
}
