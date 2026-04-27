import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveOnboardingAction } from "@/services/onboarding/actions";

export default function OnboardingPage() {
  return (
    <main className="container py-10">
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>Business onboarding</CardTitle>
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
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="services">Services</Label>
              <Textarea id="services" name="services" />
            </div>
            <div className="md:col-span-2">
              <Button type="submit">Complete onboarding</Button>
            </div>
          </form>
        </CardContent>
      </Card>
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
