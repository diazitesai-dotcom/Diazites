"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  Building2,
  Layers,
  Network,
  Search,
  ShieldAlert,
  UserCircle2,
} from "lucide-react";

import {
  approveAgencyAdminAction,
  createAgencyAccountAdminAction,
  linkSubAccountAdminAction,
  suspendAccountAdminAction,
} from "@/actions/platform-admin.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PlatformAccountView, PlatformAdminOverview } from "@/types/platform-admin";

type Props = {
  accounts: PlatformAccountView[];
  overview: PlatformAdminOverview;
};

function accountTypeBadge(type: PlatformAccountView["accountType"]) {
  const map = {
    agency: "Agency",
    sub_account: "Sub-account",
    direct: "Direct",
  } as const;
  const variant =
    type === "agency" ? "default" : type === "sub_account" ? "secondary" : "outline";
  return <Badge variant={variant}>{map[type]}</Badge>;
}

function statusBadge(status: PlatformAccountView["status"]) {
  if (status === "suspended") return <Badge variant="destructive">Suspended</Badge>;
  if (status === "pending") return <Badge variant="outline">Pending</Badge>;
  if (status === "approved") return <Badge className="bg-emerald-600/80">Approved</Badge>;
  return <Badge variant="secondary">Active</Badge>;
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="border-white/[0.06]">
      <CardContent className="flex items-center gap-3 pt-6">
        <div className="rounded-lg bg-violet-500/10 p-2">
          <Icon className="h-5 w-5 text-violet-400" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function PlatformAccountsHubClient({ accounts, overview }: Props) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const [agencyBizId, setAgencyBizId] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [linkAgencyBizId, setLinkAgencyBizId] = useState("");
  const [linkSubBizId, setLinkSubBizId] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [agencyDialogOpen, setAgencyDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  const agencies = useMemo(
    () => accounts.filter((a) => a.accountType === "agency"),
    [accounts],
  );
  const linkableSubs = useMemo(
    () => accounts.filter((a) => a.accountType !== "agency" && !a.parentBusinessId),
    [accounts],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return accounts.filter((a) => {
      if (typeFilter !== "all" && a.accountType !== typeFilter) return false;
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (!q) return true;
      return (
        a.businessName.toLowerCase().includes(q) ||
        (a.ownerEmail?.toLowerCase().includes(q) ?? false) ||
        a.planName.toLowerCase().includes(q) ||
        (a.parentAgencyName?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [accounts, query, typeFilter, statusFilter]);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total accounts" value={String(overview.totalAccounts)} icon={Building2} />
        <StatCard label="Agencies" value={String(overview.agencies)} icon={Network} />
        <StatCard label="Sub-accounts" value={String(overview.subAccounts)} icon={Layers} />
        <StatCard
          label="Active trials"
          value={String(overview.activeTrials)}
          icon={UserCircle2}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Direct" value={String(overview.directAccounts)} icon={Building2} />
        <StatCard label="Suspended" value={String(overview.suspended)} icon={ShieldAlert} />
        <StatCard label="Merchants active" value={String(overview.merchantActive)} icon={Building2} />
      </div>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" onClick={() => setAgencyDialogOpen(true)}>
          Register agency
        </Button>
        <Dialog open={agencyDialogOpen} onOpenChange={setAgencyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create agency account</DialogTitle>
              <DialogDescription>
                Promote an existing business to an agency and enable the agency hierarchy.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Business</Label>
                <Select
                  value={agencyBizId}
                  onValueChange={(v) => v && setAgencyBizId(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select business" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts
                      .filter((a) => a.accountType !== "agency")
                      .map((a) => (
                        <SelectItem key={a.businessId} value={a.businessId}>
                          {a.businessName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Agency display name</Label>
                <Input value={agencyName} onChange={(e) => setAgencyName(e.target.value)} />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                disabled={pending || !agencyBizId || !agencyName.trim()}
                onClick={() =>
                  startTransition(async () => {
                    const res = await createAgencyAccountAdminAction({
                      businessId: agencyBizId,
                      agencyName: agencyName.trim(),
                    });
                    if (res.success) setAgencyDialogOpen(false);
                    setMessage(res.success ? "Agency created." : res.error);
                  })
                }
              >
                Create agency
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button size="sm" variant="outline" onClick={() => setLinkDialogOpen(true)}>
          Link sub-account
        </Button>
        <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Link sub-account to agency</DialogTitle>
              <DialogDescription>
                Attach a client business under a parent agency account.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Parent agency</Label>
                <Select
                  value={linkAgencyBizId}
                  onValueChange={(v) => v && setLinkAgencyBizId(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Agency" />
                  </SelectTrigger>
                  <SelectContent>
                    {agencies.map((a) => (
                      <SelectItem key={a.businessId} value={a.businessId}>
                        {a.agencyName ?? a.businessName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Client business</Label>
                <Select
                  value={linkSubBizId}
                  onValueChange={(v) => v && setLinkSubBizId(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sub-account business" />
                  </SelectTrigger>
                  <SelectContent>
                    {linkableSubs.map((a) => (
                      <SelectItem key={a.businessId} value={a.businessId}>
                        {a.businessName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Label (optional)</Label>
                <Input value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                disabled={pending || !linkAgencyBizId || !linkSubBizId}
                onClick={() =>
                  startTransition(async () => {
                    const res = await linkSubAccountAdminAction({
                      agencyBusinessId: linkAgencyBizId,
                      subBusinessId: linkSubBizId,
                      label: linkLabel.trim() || undefined,
                    });
                    if (res.success) setLinkDialogOpen(false);
                    setMessage(res.success ? "Sub-account linked." : res.error);
                  })
                }
              >
                Link account
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-white/[0.06]">
        <CardHeader>
          <CardTitle>Platform accounts</CardTitle>
          <CardDescription>
            Diazites Owner → Agency → Sub-account / Client → Team members. Click a row for full
            controls.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search name, email, plan…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => v && setTypeFilter(v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="agency">Agency</SelectItem>
                <SelectItem value="sub_account">Sub-account</SelectItem>
                <SelectItem value="direct">Direct</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto rounded-md border border-white/[0.06]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Subs</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow key={a.businessId}>
                    <TableCell>
                      <Link
                        href={`/admin/accounts/${a.businessId}`}
                        className="font-medium text-violet-400 hover:underline"
                      >
                        {a.businessName}
                      </Link>
                      <p className="text-xs text-muted-foreground">{a.ownerEmail ?? "—"}</p>
                    </TableCell>
                    <TableCell>{accountTypeBadge(a.accountType)}</TableCell>
                    <TableCell>
                      <span className="text-sm">{a.planName}</span>
                      {a.subscriptionStatus === "trialing" && a.trialEndsAt ? (
                        <p className="text-xs text-muted-foreground">
                          Trial ends {new Date(a.trialEndsAt).toLocaleDateString()}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm capitalize">
                        {a.subscriptionStatus ?? a.billingStatus ?? "—"}
                      </span>
                      {a.promoCode ? (
                        <p className="text-xs text-muted-foreground">Promo: {a.promoCode}</p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm">{a.parentAgencyName ?? "—"}</TableCell>
                    <TableCell>{a.subAccountCount || "—"}</TableCell>
                    <TableCell>{statusBadge(a.status)}</TableCell>
                    <TableCell className="text-right space-x-1">
                      {a.accountType === "agency" && a.status === "pending" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              const res = await approveAgencyAdminAction(a.businessId);
                              setMessage(res.success ? "Agency approved." : res.error);
                            })
                          }
                        >
                          Approve
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant={a.status === "suspended" ? "outline" : "destructive"}
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            const res = await suspendAccountAdminAction(
                              a.businessId,
                              a.status !== "suspended",
                            );
                            setMessage(res.success ? "Status updated." : res.error);
                          })
                        }
                      >
                        {a.status === "suspended" ? "Reactivate" : "Suspend"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No accounts match your filters.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
