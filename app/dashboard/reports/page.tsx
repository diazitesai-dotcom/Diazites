import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PerformanceChart } from "@/components/reports/performance-chart";

export default function ReportsPage() {
  return (
    <main className="container space-y-6 py-10">
      <h1 className="text-3xl font-semibold">Reports Dashboard</h1>
      <section className="grid gap-4 md:grid-cols-4">
        {[
          ["Leads", "166"],
          ["Spend", "$14,100"],
          ["CPL", "$84"],
          ["ROI", "2.9x"],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{value}</CardContent>
          </Card>
        ))}
      </section>
      <PerformanceChart />
    </main>
  );
}
