"use client";

import { useTransition } from "react";

import {
  adminDisableUserServiceAction,
  adminEnableUserServiceAction,
  adminUpdateUserPlanAction,
} from "@/services/access-control/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminUserDetails, PlatformPlanKey, PlatformServiceKey } from "@/types/access-control";

const PLAN_OPTIONS: PlatformPlanKey[] = ["free", "growth", "pro", "enterprise"];

type Props = {
  details: AdminUserDetails;
};

export function UserDetailControlClient({ details }: Props) {
  const [pending, startTransition] = useTransition();
  const { user, services, auditLogs } = details;

  const toggleService = (serviceKey: PlatformServiceKey, enabled: boolean) => {
    startTransition(async () => {
      if (enabled) {
        await adminDisableUserServiceAction(user.userId, serviceKey);
      } else {
        await adminEnableUserServiceAction(user.userId, serviceKey);
      }
    });
  };

  const changePlan = (planKey: PlatformPlanKey) => {
    startTransition(async () => {
      await adminUpdateUserPlanAction(user.userId, planKey);
    });
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{user.email}</CardTitle>
          <CardDescription>
            {user.fullName ?? "No name"} · Joined{" "}
            {new Date(user.createdAt).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Badge variant="outline" className="capitalize">
            Plan: {user.planKey}
          </Badge>
          <Badge variant="secondary" className="capitalize">
            {user.accountRole}
          </Badge>
          <Badge variant={user.status === "active" ? "default" : "destructive"}>
            {user.status}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change plan</CardTitle>
          <CardDescription>
            Applies default entitlements for the plan, then you can override individual services.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {PLAN_OPTIONS.map((plan) => (
            <Button
              key={plan}
              type="button"
              size="sm"
              variant={user.planKey === plan ? "default" : "outline"}
              disabled={pending || user.planKey === plan}
              onClick={() => changePlan(plan)}
              className="capitalize"
            >
              {plan}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Service access</CardTitle>
          <CardDescription>Toggle tabs/features for this user.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {services.map((s) => (
            <div
              key={s.key}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/50 px-4 py-3"
            >
              <div>
                <p className="font-medium">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.description}</p>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">{s.key}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={s.enabled ? "default" : "secondary"}>
                  {s.enabled ? "Enabled" : "Disabled"}
                </Badge>
                <Button
                  type="button"
                  size="sm"
                  variant={s.enabled ? "outline" : "default"}
                  disabled={pending}
                  onClick={() => toggleService(s.key, s.enabled)}
                >
                  {s.enabled ? "Disable" : "Enable"}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit history</CardTitle>
          <CardDescription>Recent admin changes to plan or services.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {auditLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No audit entries yet.</p>
          ) : (
            auditLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-lg border border-border/40 px-3 py-2 text-sm"
              >
                <p className="font-medium capitalize">
                  {log.actionType.replace(/_/g, " ")}
                  {log.serviceKey ? ` · ${log.serviceKey}` : ""}
                  {log.planKey ? ` · ${log.planKey}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
