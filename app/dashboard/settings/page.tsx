import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  return (
    <main className="container space-y-6 py-10">
      <h1 className="text-3xl font-semibold">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Business Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="lead-alerts">Lead alerts</Label>
            <Switch id="lead-alerts" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="ai-follow-up">Automatic AI follow-up</Label>
            <Switch id="ai-follow-up" defaultChecked />
          </div>
          <div className="space-y-2">
            <Label htmlFor="support-email">Support email</Label>
            <Input id="support-email" defaultValue="owner@diazites.com" />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
