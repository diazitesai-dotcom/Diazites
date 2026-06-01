"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, LayoutTemplate, Megaphone, Plug, UserPlus, Users, X } from "lucide-react";

import type { SetupPanelKind } from "@/actions/mission-control-setup.actions";
import { GrowthIntegrationsHub } from "@/components/integrations/growth-integrations-hub";
import type { LinkedAdAccount } from "@/lib/integrations/integration-connect-config";
import { cn } from "@/lib/utils";

const PANEL_META: Record<
  SetupPanelKind,
  { title: string; icon: typeof Plug; description: string }
> = {
  integrations: {
    title: "Connect platforms",
    icon: Plug,
    description: "Link Zernio, Google Ads, Meta, and more — stay on Mission Control.",
  },
  campaign: {
    title: "Campaign workspace",
    icon: Megaphone,
    description: "Review and adjust campaigns the AI has drafted for you.",
  },
  landing: {
    title: "Landing page",
    icon: LayoutTemplate,
    description: "Preview your live capture page without leaving Mission Control.",
  },
  funnel: {
    title: "Funnel builder",
    icon: LayoutTemplate,
    description: "Your full growth funnel lives in the AI panel above.",
  },
  profile: {
    title: "Business profile",
    icon: Users,
    description: "Tell the AI about your business so everything stays on-brand.",
  },
  team: {
    title: "Invite your team",
    icon: UserPlus,
    description: "Add teammates to your workspace.",
  },
  agents: {
    title: "AI agents",
    icon: Bot,
    description: "Activate and manage specialist agents inline.",
  },
};

export type MissionControlIntegrationProps = {
  connectedIds: string[];
  linkedAccounts: Record<string, LinkedAdAccount>;
  oauthConfigured: { meta: boolean; google: boolean };
  starterOnly: boolean;
};

type MissionControlInlineWorkspaceProps = {
  panel: SetupPanelKind | null;
  onClose: () => void;
  integrationProps?: MissionControlIntegrationProps;
  /** Public landing page path e.g. /p/my-slug for preview iframe */
  landingPreviewUrl?: string | null;
};

export function MissionControlInlineWorkspace({
  panel,
  onClose,
  integrationProps,
  landingPreviewUrl,
}: MissionControlInlineWorkspaceProps) {
  const router = useRouter();

  if (!panel) return null;

  const meta = PANEL_META[panel];
  const Icon = meta.icon;

  return (
    <AnimatePresence>
      <motion.div
        key={panel}
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="overflow-hidden"
      >
        <div className="relative mt-3 rounded-2xl border border-cyan-500/25 bg-gradient-to-b from-cyan-950/20 via-background/80 to-violet-950/15 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/15">
                <Icon className="size-4 text-cyan-200" />
              </span>
              <div>
                <p className="text-sm font-semibold">{meta.title}</p>
                <p className="text-[11px] text-muted-foreground">{meta.description}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
              aria-label="Close panel"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className={cn("max-h-[min(70vh,520px)] overflow-y-auto p-4", panel === "integrations" && "p-0")}>
            {panel === "integrations" && integrationProps ? (
              <GrowthIntegrationsHub
                embedded
                returnPath="/dashboard"
                connectedIds={integrationProps.connectedIds}
                linkedAccounts={integrationProps.linkedAccounts}
                oauthConfigured={integrationProps.oauthConfigured}
                starterOnly={integrationProps.starterOnly}
                onConnectionChange={() => router.refresh()}
              />
            ) : null}

            {panel === "landing" && landingPreviewUrl ? (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Live preview — changes you make via the AI update this page automatically.
                </p>
                <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
                  <iframe
                    title="Landing page preview"
                    src={landingPreviewUrl}
                    className="h-[min(50vh,400px)] w-full bg-background"
                  />
                </div>
                <a
                  href={landingPreviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex text-xs font-medium text-violet-300 hover:text-violet-200"
                >
                  Open in new tab →
                </a>
              </div>
            ) : null}

            {panel === "landing" && !landingPreviewUrl ? (
              <Placeholder
                body="Ask the AI to create a landing page — it will appear here for preview once published."
              />
            ) : null}

            {panel === "campaign" ? (
              <Placeholder body="Campaigns you launch from the funnel builder show up here. Use “Approve & launch” on the Ad campaign step, or ask the AI to draft a new campaign." />
            ) : null}

            {panel === "funnel" ? (
              <Placeholder body="Use the funnel preview in the AI panel above — drag steps, edit budgets, and launch without leaving Mission Control." />
            ) : null}

            {panel === "profile" ? (
              <Placeholder body="Tell the AI your business name, location, and offer in chat — it will tailor landing pages and campaigns. Full profile fields sync from your onboarding data." />
            ) : null}

            {panel === "team" ? (
              <Placeholder body="Team invites are managed at the organization level. Ask the AI to help invite a teammate by email, or use your account settings when multi-seat is enabled on your plan." />
            ) : null}

            {panel === "agents" ? (
              <Placeholder body="Activate follow-up, ad, and qualification agents from the funnel steps above, or ask the AI to “activate follow-up agents.”" />
            ) : null}

            {panel === "integrations" && !integrationProps ? (
              <Placeholder body="Loading integration options… refresh the page if this persists." />
            ) : null}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function Placeholder({ body }: { body: string }) {
  return (
    <p className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-6 text-center text-sm leading-relaxed text-muted-foreground">
      {body}
    </p>
  );
}
