"use client";

import { useState, useTransition } from "react";
import { Rocket } from "lucide-react";

import { pushWinningCreativeAction, syncMetaMetricsAction } from "@/services/ads/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PushWinnerFormProps = {
  engineRunId: string;
  winningAssetId: string;
  defaultName: string;
};

export function PushWinnerForm({
  engineRunId,
  winningAssetId,
  defaultName,
}: PushWinnerFormProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  function handlePush(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("engine_run_id", engineRunId);
    fd.set("winning_asset_id", winningAssetId);

    startTransition(async () => {
      const result = await pushWinningCreativeAction(fd);
      if (result.success) {
        setMessage({ kind: "ok", text: `Campaign queued (${result.data.status}).` });
      } else {
        setMessage({ kind: "err", text: result.error });
      }
    });
  }

  function handleSync() {
    startTransition(async () => {
      const result = await syncMetaMetricsAction();
      if (result.success) {
        setMessage({
          kind: "ok",
          text: `Synced ${result.data.campaignsSynced} campaigns · $${result.data.totalSpendUsd.toFixed(2)} spent · ${result.data.totalLeads} leads.`,
        });
      } else {
        setMessage({ kind: "err", text: result.error });
      }
    });
  }

  return (
    <form onSubmit={handlePush} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
        <div className="space-y-1.5">
          <Label htmlFor="ad_name">Campaign name</Label>
          <Input
            id="ad_name"
            name="name"
            defaultValue={defaultName}
            placeholder="Engine campaign"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="daily_budget_usd">Daily budget (USD)</Label>
          <Input
            id="daily_budget_usd"
            name="daily_budget_usd"
            type="number"
            step="1"
            min="1"
            defaultValue={20}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={isPending} size="sm">
          <Rocket className="mr-2 size-3.5" aria-hidden /> Push to Meta
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={handleSync}>
          Sync metrics
        </Button>
        {message ? (
          <p
            className={`text-xs ${message.kind === "ok" ? "text-emerald-300" : "text-red-300"}`}
          >
            {message.text}
          </p>
        ) : null}
      </div>
    </form>
  );
}
