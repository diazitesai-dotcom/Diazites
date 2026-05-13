"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useRef, useState, useTransition } from "react";
import { Bell, CheckCheck } from "lucide-react";

import {
  listNotificationsAction,
  markNotificationReadAction,
} from "@/services/notifications/actions";
import { cn } from "@/lib/utils";
import type { NotificationRow } from "@/repositories/cross-cutting.repository";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [unread, setUnread] = useState(0);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement | null>(null);

  async function refresh() {
    const r = await listNotificationsAction();
    if (r.success) {
      setItems(r.data.items);
      setUnread(r.data.unread);
    }
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  function markAll() {
    startTransition(async () => {
      const fd = new FormData();
      await markNotificationReadAction(fd);
      await refresh();
    });
  }

  function markOne(id: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      await markNotificationReadAction(fd);
      await refresh();
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        className="relative flex size-9 items-center justify-center rounded-lg border border-border/60 text-foreground transition-colors hover:bg-white/[0.06]"
        onClick={() => setOpen((o) => !o)}
      >
        <Bell className="size-4" aria-hidden />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-violet-500 px-1 text-[10px] font-semibold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[340px] overflow-hidden rounded-xl border border-border/70 bg-background/95 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
            <p className="text-sm font-semibold">Notifications</p>
            <button
              type="button"
              onClick={markAll}
              disabled={isPending || unread === 0}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <CheckCheck className="size-3.5" aria-hidden /> Mark all read
            </button>
          </div>
          <ul className="max-h-[420px] overflow-y-auto divide-y divide-border/40">
            {items.length === 0 ? (
              <li className="px-3 py-6 text-center text-xs text-muted-foreground">
                You're all caught up.
              </li>
            ) : (
              items.map((n) => {
                const isUnread = n.read_at == null;
                const inner = (
                  <div
                    className={cn(
                      "block px-3 py-2 transition-colors",
                      isUnread ? "bg-violet-500/[0.06]" : "bg-transparent hover:bg-white/[0.03]",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{n.title}</p>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    {n.body ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                    ) : null}
                  </div>
                );
                return (
                  <li key={n.id} onClick={() => isUnread && markOne(n.id)} className="cursor-pointer">
                    {n.link ? <Link href={n.link}>{inner}</Link> : inner}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
