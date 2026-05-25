import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function OrganizationPlaceholderPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="border-dashed border-white/[0.1]">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Enterprise controls ship in a future release. Use Team, Billing, and Workspace tabs today.
      </CardContent>
    </Card>
  );
}
