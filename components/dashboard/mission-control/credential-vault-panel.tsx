"use client";

import Link from "next/link";
import { KeyRound, Lock, ShieldCheck, TestTube2 } from "lucide-react";
import { motion } from "framer-motion";

import { GlassCard } from "@/components/dashboard/mission-control/glass-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { fadeItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

const VAULT_ITEMS = [
  { id: "meta", label: "Meta access token", status: "Stored · encrypted" },
  { id: "google", label: "Google Ads OAuth", status: "Not configured" },
  { id: "openai", label: "OpenAI API key", status: "Stored · encrypted" },
  { id: "stripe", label: "Stripe secret key", status: "Stored · encrypted" },
  { id: "crm", label: "CRM credentials", status: "Pending setup" },
  { id: "sendgrid", label: "SendGrid API key", status: "Expired — reconnect" },
];

export function CredentialVaultPanel() {
  return (
    <motion.div variants={fadeItem} initial="hidden" animate="show">
      <GlassCard
        title="Credential Vault"
        description="Encrypted integrations — agents operate with permission-scoped keys"
        headerExtra={
          <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-violet-200">
            <Lock className="size-3" />
            AES-256
          </span>
        }
      >
        <ul className="space-y-2">
          {VAULT_ITEMS.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-2">
                <KeyRound className="size-3.5 shrink-0 text-violet-300" />
                <span className="truncate text-sm font-medium">{item.label}</span>
              </div>
              <span className="shrink-0 text-[10px] text-muted-foreground">{item.status}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/dashboard/integrations"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-lg border-white/10")}
          >
            <ShieldCheck className="mr-1.5 size-3.5" />
            Manage permissions
          </Link>
          <Button type="button" variant="outline" size="sm" className="rounded-lg border-white/10">
            <TestTube2 className="mr-1.5 size-3.5" />
            Test all connections
          </Button>
        </div>
      </GlassCard>
    </motion.div>
  );
}
