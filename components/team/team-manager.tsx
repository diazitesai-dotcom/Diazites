"use client";

import { formatDistanceToNow } from "date-fns";
import { useState, useTransition } from "react";
import { Plus, Trash2, UserPlus } from "lucide-react";

import {
  inviteTeamMemberAction,
  removeTeamMemberAction,
  setTeamRoleAction,
} from "@/services/team/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TeamMemberRow, TeamRole } from "@/repositories/cross-cutting.repository";

const ROLES: TeamRole[] = ["owner", "admin", "member", "viewer"];

export function TeamManager({ members }: { members: TeamMemberRow[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const result = await inviteTeamMemberAction(fd);
      if (!result.success) setError(result.error);
      else form.reset();
    });
  }

  function onSetRole(id: string, role: TeamRole) {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("role", role);
    startTransition(async () => {
      await setTeamRoleAction(fd);
    });
  }

  function onRemove(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      await removeTeamMemberAction(fd);
    });
  }

  return (
    <div className="space-y-8">
      <Card className="border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-base">Invite a teammate</CardTitle>
          <CardDescription>
            Members can view + edit; viewers get read-only access. Owners and admins can manage the team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onInvite} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-[2fr_1fr_auto]">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="teammate@example.com" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  name="role"
                  defaultValue="member"
                  className="h-9 w-full rounded-md border border-border/60 bg-background/80 px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r} className="capitalize">
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={isPending}>
                  <Plus className="mr-1 size-3.5" aria-hidden /> Invite
                </Button>
              </div>
            </div>
            {error ? <p className="text-xs text-red-300">{error}</p> : null}
          </form>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Members ({members.length})
        </h3>
        {members.length === 0 ? (
          <Card className="border-dashed border-white/[0.08]">
            <CardContent className="py-8 text-sm text-muted-foreground">
              No teammates yet. Invite one above.
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card/60">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Invited</th>
                  <th className="px-3 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-t border-border/40">
                    <td className="px-3 py-2 font-medium">
                      <span className="flex items-center gap-2">
                        <UserPlus className="size-3.5 text-muted-foreground" aria-hidden />
                        {m.email}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        defaultValue={m.role}
                        disabled={isPending || m.role === "owner"}
                        onChange={(e) => onSetRole(m.id, e.target.value as TeamRole)}
                        className="h-8 rounded-md border border-border/60 bg-background/80 px-2 text-xs capitalize outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r} className="capitalize">
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {m.accepted_at ? (
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-300">
                          Accepted
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-300">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(m.invited_at), { addSuffix: true })}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isPending || m.role === "owner"}
                        onClick={() => onRemove(m.id)}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
