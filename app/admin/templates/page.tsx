import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const templateGroups = [
  { name: "Ads", items: 24 },
  { name: "Landing Pages", items: 12 },
  { name: "Emails", items: 31 },
  { name: "SMS", items: 18 },
  { name: "Funnels", items: 9 },
];

export default function TemplateLibraryPage() {
  return (
    <main className="container space-y-6 py-10">
      <h1 className="text-3xl font-semibold">Template Library</h1>
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templateGroups.map((group) => (
          <Card key={group.name}>
            <CardHeader>
              <CardTitle>{group.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Ready-to-deploy assets</p>
              <Badge>{group.items}</Badge>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
