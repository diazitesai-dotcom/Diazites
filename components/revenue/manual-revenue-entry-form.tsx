"use client";

import { useState } from "react";

import { addManualRevenueAction } from "@/actions/revenue.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { REVENUE_SOURCE_CATALOG } from "@/lib/revenue/source-catalog";

export function ManualRevenueEntryForm() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setMessage(null);
    const result = await addManualRevenueAction(formData);
    setPending(false);
    if (result.success) {
      setMessage("Revenue recorded. Refresh to see updated totals.");
    } else {
      setMessage(result.error ?? "Could not save");
    }
  }

  return (
    <form action={handleSubmit} className="space-y-3 rounded-xl border border-white/[0.08] p-4">
      <h3 className="text-sm font-semibold">Manual revenue entry</h3>
      <p className="text-xs text-muted-foreground">
        Assign revenue to a lead or campaign — CRM, Stripe, Shopify, or manual close
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="lead_name">Lead name</Label>
          <Input id="lead_name" name="lead_name" placeholder="Jane Smith" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="amount">Revenue amount ($)</Label>
          <Input id="amount" name="amount" type="number" min="0" step="0.01" required />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="source_key">Source</Label>
          <select
            id="source_key"
            name="source_key"
            className="w-full rounded-lg border border-white/10 bg-background px-3 py-2 text-sm"
            defaultValue="manual_sales"
          >
            {REVENUE_SOURCE_CATALOG.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="campaign">Campaign</Label>
          <Input id="campaign" name="campaign" placeholder="Optional" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="close_method">Close method</Label>
          <select
            id="close_method"
            name="close_method"
            className="w-full rounded-lg border border-white/10 bg-background px-3 py-2 text-sm"
            defaultValue="manual_entry"
          >
            <option value="manual_entry">Manual entry</option>
            <option value="crm_won">CRM deal won</option>
            <option value="stripe">Stripe</option>
            <option value="shopify">Shopify</option>
            <option value="square">Square</option>
            <option value="quickbooks">QuickBooks</option>
          </select>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="attribution_type">Attribution type</Label>
          <select
            id="attribution_type"
            name="attribution_type"
            className="w-full rounded-lg border border-white/10 bg-background px-3 py-2 text-sm"
            defaultValue="manual_override"
          >
            <option value="first_touch">First-touch</option>
            <option value="last_touch">Last-touch</option>
            <option value="multi_touch">Multi-touch</option>
            <option value="linear">Linear</option>
            <option value="ai_assisted">AI-assisted</option>
            <option value="manual_override">Manual override</option>
          </select>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Input id="notes" name="notes" placeholder="Optional context" />
        </div>
      </div>
      <Button type="submit" disabled={pending} className="rounded-xl">
        {pending ? "Saving…" : "Record revenue"}
      </Button>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </form>
  );
}
