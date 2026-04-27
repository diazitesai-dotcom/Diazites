import { LeadsBoard } from "@/components/leads/leads-board";

const sampleLeads = [
  {
    id: "1",
    name: "John Carter",
    source: "Facebook Ads",
    campaign: "Storm Season Special",
    status: "new" as const,
    notes: "Needs full replacement quote",
  },
  {
    id: "2",
    name: "Maya Smith",
    source: "Google Search",
    campaign: "Emergency Repairs",
    status: "contacted" as const,
    notes: "Requested callback after 5PM",
  },
  {
    id: "3",
    name: "Robert Diaz",
    source: "Landing Page",
    campaign: "Metal Roof Upgrade",
    status: "qualified" as const,
    notes: "Budget approved",
  },
  {
    id: "4",
    name: "Nina Hall",
    source: "Retargeting",
    campaign: "Roof Inspection Offer",
    status: "booked" as const,
    notes: "Appointment Tuesday 10AM",
  },
];

export default function LeadsManagerPage() {
  return (
    <main className="container space-y-6 py-10">
      <h1 className="text-3xl font-semibold">Leads Manager</h1>
      <p className="text-sm text-muted-foreground">
        Track every lead from first touch to won job.
      </p>
      <LeadsBoard leads={sampleLeads} />
    </main>
  );
}
