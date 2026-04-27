import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AGENTS } from "@/utils/constants";

const metrics = [
  { label: "Leads Generated", value: "124" },
  { label: "Campaigns", value: "8" },
  { label: "Spend", value: "$14,300" },
  { label: "Cost Per Lead", value: "$115" },
  { label: "Booked Appointments", value: "27" },
  { label: "Revenue Estimate", value: "$189,000" },
];

export default function DashboardPage() {
  return (
    <main className="container space-y-8 py-10">
      <section className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                {metric.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {metric.value}
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          "Business Profile",
          "Agent Manager",
          "Leads Manager (CRM)",
          "Campaigns",
          "Reports",
          "Billing",
          "Settings",
        ].map((name) => (
          <Card key={name}>
            <CardHeader>
              <CardTitle>{name}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Section scaffold complete for modular feature integration.
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {AGENTS.map((agent) => (
          <Card key={agent.key}>
            <CardHeader>
              <CardTitle>{agent.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Setup in progress (24-72 hours)
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
