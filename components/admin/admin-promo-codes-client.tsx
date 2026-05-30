"use client";

import { useState, useTransition } from "react";

import { createPromoCodeAdminAction, togglePromoCodeAdminAction } from "@/actions/promo.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PromoRow = {
  id: string;
  code: string;
  trial_days: number;
  use_count: number;
  max_uses: number | null;
  active: boolean;
  source: string | null;
  redemptions: number;
};

export function AdminPromoCodesClient({ codes }: { codes: PromoRow[] }) {
  const [code, setCode] = useState("");
  const [trialDays, setTrialDays] = useState(30);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <Card className="border-white/[0.06]">
        <CardHeader>
          <CardTitle>Create code</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label>Code</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
          </div>
          <div>
            <Label>Trial days</Label>
            <Input
              type="number"
              value={trialDays}
              onChange={(e) => setTrialDays(Number(e.target.value))}
            />
          </div>
          <div className="flex items-end">
            <Button
              disabled={pending || !code.trim()}
              onClick={() =>
                startTransition(async () => {
                  const res = await createPromoCodeAdminAction({
                    code,
                    trialDays,
                    source: "admin",
                  });
                  setMessage(res.success ? "Code created" : res.error);
                  if (res.success) setCode("");
                })
              }
            >
              Create code
            </Button>
          </div>
        </CardContent>
      </Card>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      <Card className="border-white/[0.06]">
        <CardHeader>
          <CardTitle>All codes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {codes.map((row) => (
            <div
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/[0.06] px-3 py-2 text-sm"
            >
              <div>
                <span className="font-medium">{row.code}</span>
                <span className="ml-2 text-muted-foreground">
                  {row.trial_days}d · uses {row.use_count}
                  {row.max_uses != null ? `/${row.max_uses}` : ""} · redemptions {row.redemptions}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await togglePromoCodeAdminAction(row.id, !row.active);
                  })
                }
              >
                {row.active ? "Pause" : "Activate"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
