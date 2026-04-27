"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function FunnelBuilderPage() {
  const [headline, setHeadline] = useState("Fast Roofing Estimates in 24 Hours");
  const [offer, setOffer] = useState("Free roof inspection + same-day quote");
  const [location, setLocation] = useState("Tampa Bay");

  return (
    <main className="container grid gap-6 py-10 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Lead Funnel Builder</CardTitle>
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

      <Card>
        <CardHeader>
          <CardTitle>Live Landing Preview + Capture Form</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-xs uppercase text-muted-foreground">Preview</p>
            <h2 className="mt-2 text-2xl font-semibold">{headline}</h2>
            <p className="mt-1 text-muted-foreground">{offer}</p>
            <p className="mt-1 text-sm">Serving {location}</p>
          </div>
          <LeadCaptureForm />
        </CardContent>
      </Card>
    </main>
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
      <Button disabled={loading} type="submit" className="w-full">
        {loading ? "Submitting..." : "Submit lead"}
      </Button>
      {done ? <p className="text-sm text-muted-foreground">{done}</p> : null}
    </form>
  );
}
