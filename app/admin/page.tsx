import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminPage() {
  return (
    <main className="container space-y-8 py-10">
      <section className="grid gap-4 md:grid-cols-4">
        {[
          ["Total Clients", "42"],
          ["Leads", "1,248"],
          ["Campaigns", "157"],
          ["Revenue", "$82,740"],
        ].map(([name, value]) => (
          <Card key={name}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                {name}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{value}</CardContent>
          </Card>
        ))}
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {[
          "Client Management",
          "Agent Management",
          "Campaigns",
          "Leads",
          "AI Automation",
          "Billing",
          "Templates",
          "Reports",
          "Support",
          "Roles",
          "Alerts",
          "Settings",
        ].map((name) => (
          <Card key={name}>
            <CardHeader>
              <CardTitle>{name}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Internal module scaffold ready.
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
