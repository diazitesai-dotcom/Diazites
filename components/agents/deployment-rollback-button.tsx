"use client";

import { useState, useTransition } from "react";
import { RotateCcw } from "lucide-react";

import { rollbackDeploymentAction } from "@/actions/agent-deployment.actions";
import { Button } from "@/components/ui/button";
import {
  clearLastDeployment,
  getLastDeployment,
  type LastDeploymentRecord,
} from "@/lib/agents/deployment-session";
import { agentDisplayName } from "@/lib/agents/deployment-catalog";

export function DeploymentRollbackButton({
  onRolledBack,
}: {
  onRolledBack?: () => void;
}) {
  const [record, setRecord] = useState<LastDeploymentRecord | null>(() => getLastDeployment());
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (!record) return null;

  function rollback() {
    startTransition(async () => {
      setMessage(null);
      const result = await rollbackDeploymentAction(record!.agents);
      if (!result.ok) {
        setMessage(result.error ?? "Rollback failed");
        return;
      }
      clearLastDeployment();
      setRecord(null);
      setMessage(`Rolled back ${record!.label}`);
      onRolledBack?.();
    });
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Rollback available
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Undo last deployment:{" "}
        {record.agents.map((a) => agentDisplayName(a)).join(", ")}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2 w-full rounded-lg border-white/10"
        disabled={pending}
        onClick={rollback}
      >
        <RotateCcw className="mr-1.5 size-3.5" />
        {pending ? "Rolling back…" : "Rollback growth stack"}
      </Button>
      {message ? <p className="mt-2 text-[11px] text-emerald-300/90">{message}</p> : null}
    </div>
  );
}
