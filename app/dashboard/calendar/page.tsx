import { GrowthModulePage } from "@/components/layout/growth-module-page";

export default function CalendarPage() {
  return (
    <GrowthModulePage
      eyebrow="Calendar"
      title="Appointments & booking"
      description="Booking links, Google Calendar sync, availability, and appointment reminders via the Appointment Agent."
      purposeTitle="Google Calendar"
      purposeDescription="Phase 3 connects calendar OAuth; leads update to Booked on confirmation."
      phase={3}
      primaryHref="/dashboard/leads"
      primaryLabel="Booked leads"
    />
  );
}
