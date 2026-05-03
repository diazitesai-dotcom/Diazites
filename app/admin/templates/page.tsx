import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const templateGroups = [
  { name: "Ads", items: 24 },
  { name: "Landing Pages", items: 12 },
  { name: "Emails", items: 31 },
  { name: "SMS", items: 18 },
  { name: "Funnels", items: 9 },
];

export default function TemplateLibraryPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <PageHeader
        eyebrow="Library"
        title="Template library"
        description="Ready-to-deploy assets grouped by channel — versioning and approvals plug in when you wire governance."
      />
      <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {templateGroups.map((group) => (
          <Card key={group.name} className="border-white/[0.06] transition-transform hover:-translate-y-0.5">
            <CardHeader>
              <CardTitle className="text-lg">{group.name}</CardTitle>
              <CardDescription>Ready-to-deploy assets</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Curated blocks</p>
              <Badge variant="outline" className="tabular-nums">
                {group.items}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
