"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { updateAttributionSettingsAction } from "@/actions/revenue-settings.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ATTRIBUTION_MODEL_LABELS } from "@/lib/revenue/attribution-math";
import type { BusinessProfile } from "@/types/platform-growth";
import type { AttributionModel } from "@/types/revenue-attribution";

const MODELS: AttributionModel[] = [
  "first_touch",
  "last_touch",
  "multi_touch",
  "linear",
  "ai_assisted",
  "manual_override",
];

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex gap-2">
        <Input readOnly value={value} className="font-mono text-xs" />
        <Button type="button" variant="outline" size="icon" onClick={copy} aria-label={`Copy ${label}`}>
          {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
        </Button>
      </div>
    </div>
  );
}

export function RevenueAttributionSettings({
  businessId,
  profile,
  appUrl,
}: {
  businessId: string;
  profile: BusinessProfile;
  appUrl: string;
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const initialModel = profile.attributionModel ?? "ai_assisted";

  const stripeWebhookUrl = `${appUrl}/api/webhooks/stripe`;
  const shopifyWebhookUrl = `${appUrl}/api/webhooks/shopify`;

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setMessage(null);
    formData.set("business_id", businessId);
    const result = await updateAttributionSettingsAction(formData);
    setPending(false);
    setMessage(result.success ? "Settings saved." : result.error ?? "Could not save");
  }

  return (
    <div className="space-y-6">
      <Card className="border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-lg">Revenue attribution</CardTitle>
          <CardDescription>
            Choose how credit is assigned when a lead closes — used across Mission Control and
            reports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="attribution_model">Attribution model</Label>
              <select
                id="attribution_model"
                name="attribution_model"
                defaultValue={initialModel}
                className="w-full rounded-lg border border-white/10 bg-background px-3 py-2 text-sm"
              >
                {MODELS.map((m) => (
                  <option key={m} value={m}>
                    {ATTRIBUTION_MODEL_LABELS[m] ?? m}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Reports show this method so everyone understands how revenue was counted.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shopify_shop_domain">Shopify store domain</Label>
              <Input
                id="shopify_shop_domain"
                name="shopify_shop_domain"
                placeholder="my-store.myshopify.com"
                defaultValue={profile.shopifyShopDomain ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shopify_webhook_secret">Shopify webhook secret</Label>
              <Input
                id="shopify_webhook_secret"
                name="shopify_webhook_secret"
                type="password"
                placeholder="From Shopify admin → Notifications → Webhooks"
                defaultValue={profile.shopifyWebhookSecret ?? ""}
              />
            </div>

            <Button type="submit" disabled={pending} className="rounded-xl">
              {pending ? "Saving…" : "Save attribution settings"}
            </Button>
            {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
          </form>
        </CardContent>
      </Card>

      <Card className="border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-lg">Live revenue webhooks</CardTitle>
          <CardDescription>
            Automatically record revenue when customers pay via Stripe or Shopify.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
            <p className="text-sm font-medium text-violet-100">Stripe</p>
            <CopyField label="Webhook URL" value={stripeWebhookUrl} />
            <p className="text-xs text-muted-foreground leading-relaxed">
              In Stripe Dashboard → Developers → Webhooks, subscribe to{" "}
              <span className="text-foreground">checkout.session.completed</span>,{" "}
              <span className="text-foreground">payment_intent.succeeded</span>, and{" "}
              <span className="text-foreground">invoice.paid</span>. Add metadata on payments:{" "}
              <code className="rounded bg-muted px-1">business_id</code> = your workspace ID{" "}
              <span className="font-mono text-violet-300">{businessId}</span>, and{" "}
              <code className="rounded bg-muted px-1">track_revenue</code> ={" "}
              <code className="rounded bg-muted px-1">true</code>. Optional:{" "}
              <code className="rounded bg-muted px-1">campaign</code>,{" "}
              <code className="rounded bg-muted px-1">lead_name</code>.
            </p>
          </div>

          <div className="space-y-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="text-sm font-medium text-emerald-100">Shopify</p>
            <CopyField label="Webhook URL" value={shopifyWebhookUrl} />
            <p className="text-xs text-muted-foreground leading-relaxed">
              In Shopify → Settings → Notifications → Webhooks, create a webhook for{" "}
              <span className="text-foreground">Order payment</span> (orders/paid) pointing to the
              URL above. Set your store domain and signing secret in this form, then save.
            </p>
          </div>

          <p className="text-[10px] text-muted-foreground">
            Revenue also flows from CRM won deals, manual entry, and CSV import in Mission Control.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
