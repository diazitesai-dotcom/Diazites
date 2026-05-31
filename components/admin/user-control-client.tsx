"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AdminUserListItem } from "@/types/access-control";

type Props = {
  users: AdminUserListItem[];
};

export function UserControlClient({ users }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.fullName?.toLowerCase().includes(q) ?? false),
    );
  }, [users, query]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Search users</CardTitle>
          <CardDescription>
            View plan, enabled services, and toggle access per account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by email or name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-2xl border border-border/60">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border/60 bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Services</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.userId} className="border-b border-border/40 last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{u.email}</p>
                  {u.fullName ? (
                    <p className="text-xs text-muted-foreground">{u.fullName}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3 capitalize">{u.planKey}</td>
                <td className="px-4 py-3">
                  <Badge variant={u.accountRole === "owner_admin" ? "default" : "secondary"}>
                    {u.accountRole}
                  </Badge>
                </td>
                <td className="px-4 py-3 capitalize">{u.status}</td>
                <td className="px-4 py-3">{u.enabledServiceCount}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/user-control/${u.userId}`}
                    className="text-sm font-medium text-violet-400 hover:text-violet-300"
                  >
                    Manage →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No users found.</p>
        ) : null}
      </div>
    </div>
  );
}
