"use client";

import { useState, useTransition } from "react";
import { Shield, UserMinus } from "lucide-react";

import {
  grantPlatformAdminAction,
  revokePlatformAdminAction,
} from "@/actions/admin-users.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PlatformAdminUserView } from "@/services/admin/admin-users.service";

type Props = {
  admins: PlatformAdminUserView[];
  currentUserId: string;
};

export function AdminUsersManagerClient({ admins, currentUserId }: Props) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <Card className="border-white/[0.06]">
        <CardHeader>
          <CardTitle>Grant platform admin</CardTitle>
          <CardDescription>
            Add Diazites operator access for an existing user. They must have signed up with this
            email first.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1">
            <Label htmlFor="admin-email">User email</Label>
            <Input
              id="admin-email"
              type="email"
              placeholder="owner@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
            />
          </div>
          <Button
            disabled={pending || !email.trim()}
            onClick={() =>
              startTransition(async () => {
                const res = await grantPlatformAdminAction(email);
                setMessage(res.success ? "Platform admin access granted." : res.error);
                if (res.success) setEmail("");
              })
            }
          >
            Grant admin access
          </Button>
        </CardContent>
      </Card>

      {message ? (
        <p className="text-sm text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}

      <Card className="border-white/[0.06]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-5 text-violet-400" aria-hidden />
            Platform admins
          </CardTitle>
          <CardDescription>
            Users who can access /admin, manage tenants, and switch from the account menu.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Granted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.length === 0 ? (
                <TableRow className="border-border/60">
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No platform admins found.
                  </TableCell>
                </TableRow>
              ) : (
                admins.map((admin) => {
                  const isSelf = admin.userId === currentUserId;
                  return (
                    <TableRow key={admin.id} className="border-border/60">
                      <TableCell className="font-medium">
                        {admin.fullName ?? "—"}
                        {isSelf ? (
                          <Badge variant="outline" className="ml-2">
                            You
                          </Badge>
                        ) : null}
                      </TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{admin.role}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(admin.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={pending || isSelf}
                          title={isSelf ? "You cannot remove yourself" : "Revoke admin access"}
                          onClick={() =>
                            startTransition(async () => {
                              const res = await revokePlatformAdminAction(admin.userId);
                              setMessage(
                                res.success ? "Platform admin access revoked." : res.error,
                              );
                            })
                          }
                        >
                          <UserMinus className="size-4" aria-hidden />
                          Revoke
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
