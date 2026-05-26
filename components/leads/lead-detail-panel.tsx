"use client";

import { useState, useTransition } from "react";
import { Trash2, X } from "lucide-react";

import {
  createLeadAction,
  deleteLeadAction,
  saveLeadAction,
} from "@/actions/leads.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { bucketClasses, bucketLabel } from "@/lib/lead-scoring";
import { cn } from "@/lib/utils";
import type { LeadBoardRow } from "@/services/leads/lead.service";
import type { PipelineStatus } from "@/types/domain";

const STATUSES: PipelineStatus[] = [
  "new",
  "contacted",
  "qualified",
  "booked",
  "won",
  "lost",
];

type LeadDetailPanelProps = {
  lead: LeadBoardRow | null;
  mode: "view" | "create";
  onClose: () => void;
  onSaved?: () => void;
};

export function LeadDetailPanel({ lead, mode, onClose, onSaved }: LeadDetailPanelProps) {
  const open = mode === "create" || lead !== null;
  if (!open) return null;

  const formKey = mode === "create" ? "create" : lead!.id;

  return (
    <LeadDetailForm
      key={formKey}
      lead={lead}
      mode={mode}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function LeadDetailForm({ lead, mode, onClose, onSaved }: LeadDetailPanelProps) {
  const isCreate = mode === "create";
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(isCreate ? "" : (lead?.name ?? ""));
  const [phone, setPhone] = useState(isCreate ? "" : (lead?.phone ?? ""));
  const [email, setEmail] = useState(isCreate ? "" : (lead?.email ?? ""));
  const [address, setAddress] = useState(isCreate ? "" : (lead?.address ?? ""));
  const [roofingNeed, setRoofingNeed] = useState(isCreate ? "" : (lead?.roofingNeed ?? ""));
  const [timeline, setTimeline] = useState(isCreate ? "" : (lead?.timeline ?? ""));
  const [source, setSource] = useState(isCreate ? "manual" : (lead?.source ?? ""));
  const [status, setStatus] = useState<PipelineStatus>(isCreate ? "new" : (lead?.status ?? "new"));
  const [notes, setNotes] = useState(isCreate ? "" : (lead?.notes ?? ""));

  function handleSave() {
    setError(null);
    if (mode === "create") {
      const fd = new FormData();
      fd.set("name", name);
      fd.set("phone", phone);
      fd.set("email", email);
      fd.set("address", address);
      fd.set("roofing_need", roofingNeed);
      fd.set("timeline", timeline);
      fd.set("notes", notes);
      fd.set("source", source);
      startTransition(async () => {
        const res = await createLeadAction(fd);
        if (!res.ok) {
          setError(res.error);
          return;
        }
        onSaved?.();
        onClose();
      });
      return;
    }

    if (!lead) return;
    startTransition(async () => {
      const res = await saveLeadAction(lead.id, {
        name,
        phone: phone || null,
        email: email || null,
        address: address || null,
        roofingNeed: roofingNeed || null,
        timeline: timeline || null,
        source: source || null,
        status,
        notes: notes || null,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onSaved?.();
      onClose();
    });
  }

  function handleDelete() {
    if (!lead || !confirm(`Delete lead "${lead.name}"? This cannot be undone.`)) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteLeadAction(lead.id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onSaved?.();
      onClose();
    });
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-white/10 bg-background shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-panel-title"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 id="lead-panel-title" className="text-lg font-semibold">
              {mode === "create" ? "New lead" : lead?.name}
            </h2>
            {lead ? (
              <span
                className={cn(
                  "mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold tabular-nums",
                  bucketClasses(lead.scoreBucket),
                )}
              >
                {lead.score} · {bucketLabel(lead.scoreBucket)}
              </span>
            ) : null}
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {error ? (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="lead-name">Name</Label>
            <Input id="lead-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lead-phone">Phone</Label>
            <Input id="lead-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lead-email">Email</Label>
            <Input id="lead-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lead-address">Address</Label>
            <Input id="lead-address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lead-need">Roofing need</Label>
            <Input id="lead-need" value={roofingNeed} onChange={(e) => setRoofingNeed(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lead-timeline">Timeline</Label>
            <Input id="lead-timeline" value={timeline} onChange={(e) => setTimeline(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lead-source">Source</Label>
            <Input id="lead-source" value={source} onChange={(e) => setSource(e.target.value)} />
          </div>
          {mode !== "create" ? (
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as PipelineStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="lead-notes">Notes</Label>
            <Textarea id="lead-notes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {lead ? <Badge variant="outline">{lead.campaign}</Badge> : null}
        </div>

        <div className="flex gap-2 border-t border-white/10 p-5">
          {mode !== "create" && lead ? (
            <Button
              type="button"
              variant="outline"
              className="text-red-300 hover:text-red-200"
              disabled={pending}
              onClick={handleDelete}
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </Button>
          ) : null}
          <Button
            type="button"
            variant="gradient"
            className="ml-auto flex-1 rounded-xl"
            disabled={pending || !name.trim()}
            onClick={handleSave}
          >
            {pending ? "Saving…" : mode === "create" ? "Create lead" : "Save"}
          </Button>
        </div>
      </aside>
    </>
  );
}
