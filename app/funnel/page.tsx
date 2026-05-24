"use client";

import { useState } from "react";

import { MarketingNavbar } from "@/components/layout/marketing-navbar";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function FunnelBuilderPage() {
  const [headline, setHeadline] = useState("Fast Roofing Estimates in 24 Hours");
  const [offer, setOffer] = useState("Free roof inspection + same-day quote");
  const [location, setLocation] = useState("Tampa Bay");

  return (
    <div className="min-h-screen bg-background">
      <MarketingNavbar />
      <main className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
        <PageHeader
          eyebrow="Conversion"
          title="Lead funnel builder"
          description="Compose offers and preview capture UX before pushing live to campaigns."
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-white/[0.06]">
            <CardHeader>
              <CardTitle className="text-lg">Editor</CardTitle>
              <CardDescription>Headline, offer, and geo targeting.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="headline">Headline</Label>
                <Input id="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="offer">Offer</Label>
                <Input id="offer" value={offer} onChange={(e) => setOffer(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/[0.06]">
            <CardHeader>
              <CardTitle className="text-lg">Live landing preview</CardTitle>
              <CardDescription>Capture form posts to your leads API.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-5">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Preview</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">{headline}</h2>
                <p className="mt-2 text-muted-foreground">{offer}</p>
                <p className="mt-2 text-sm text-muted-foreground">Serving {location}</p>
              </div>
              <LeadCaptureForm />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function LeadCaptureForm() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setDone("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      businessId: formData.get("business_id"),
      name: formData.get("name"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      address: formData.get("address"),
      roofingNeed: formData.get("roofing_need"),
      timeline: formData.get("timeline"),
      notes: formData.get("notes"),
      source: "funnel",
    };

    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);
    if (!response.ok) {
      setDone("Lead submit failed. Check business id and API keys.");
      return;
    }

    setDone("Lead submitted. AI follow-up queued.");
    event.currentTarget.reset();
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <Input name="business_id" placeholder="Business UUID (required)" required />
      <Input name="name" placeholder="Name" required />
      <Input name="phone" placeholder="Phone" required />
      <Input name="email" type="email" placeholder="Email" required />
      <Input name="address" placeholder="Address" />
      <Input name="roofing_need" placeholder="Roofing need" />
      <Input name="timeline" placeholder="Timeline" />
      <Textarea name="notes" placeholder="Notes" />
      <Button disabled={loading} type="submit" variant="gradient" className="w-full rounded-xl">
        {loading ? "Submitting…" : "Submit lead"}
      </Button>
      {done ? <p className="text-sm text-muted-foreground">{done}</p> : null}
    </form>
  );
}
