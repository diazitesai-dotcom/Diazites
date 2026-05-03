import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Notifications, routing preferences, and operator contact channels."
      />
      <Card className="border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-lg">Business notifications</CardTitle>
          <CardDescription>
            Control how Diazites surfaces alerts without overwhelming your team.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
            <Label htmlFor="lead-alerts" className="text-sm font-medium">
              Lead alerts
            </Label>
            <Switch id="lead-alerts" defaultChecked />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
            <Label htmlFor="ai-follow-up" className="text-sm font-medium">
              Automatic AI follow-up
            </Label>
            <Switch id="ai-follow-up" defaultChecked />
          </div>
          <div className="space-y-2">
            <Label htmlFor="support-email">Support email</Label>
            <Input id="support-email" defaultValue="owner@diazites.com" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
