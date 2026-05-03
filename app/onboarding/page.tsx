import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveOnboardingAction } from "@/services/onboarding/actions";

export default function OnboardingPage() {
  return (
    <main className="relative min-h-screen px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_-10%,rgba(139,92,246,0.15),transparent)]" />
      <div className="relative mx-auto max-w-3xl space-y-10">
        <PageHeader
          eyebrow="Setup"
          title="Business onboarding"
          description="Tell us how you operate so campaigns, agents, and CRM stages match your market reality."
        />
        <Card className="border-white/[0.06] shadow-[0_24px_80px_-48px_rgba(99,102,241,0.35)]">
          <CardHeader>
            <CardTitle className="text-lg">Company profile</CardTitle>
            <CardDescription>Required before launching agents and paid media.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={saveOnboardingAction} className="grid gap-4 md:grid-cols-2">
              <Field label="Business name" name="business_name" />
              <Field label="Owner name" name="owner_name" />
              <Field label="Email" name="email" type="email" />
              <Field label="Phone" name="phone" />
              <Field label="Website" name="website" />
              <Field label="Service area" name="service_area" />
              <Field label="City/state" name="city_state" />
              <Field label="Business hours" name="business_hours" />
              <Field label="Monthly budget" name="monthly_budget" type="number" />
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="services">Services</Label>
                <Textarea id="services" name="services" rows={4} />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" variant="gradient" className="rounded-xl px-8">
                  Complete onboarding
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
}: {
  label: string;
  name: string;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} />
    </div>
  );
}
