"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { KeyRound, Plug } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  connectZernioWithApiKeyAction,
  listZernioCampaignsAction,
  testZernioConnectionAction,
} from "@/services/integrations/zernio.actions";

type ZernioConnectorProps = {
  configured: boolean;
};

export function ZernioConnector({ configured }: ZernioConnectorProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<
    Array<{ _id?: string; name?: string; status?: string; platform?: string }>
  >([]);

  function testConnection() {
    setMessage(null);
    startTransition(async () => {
      const res = await testZernioConnectionAction();
      if (!res.success) {
        setMessage(res.error);
        return;
      }
      setMessage(`API key valid — ${res.data.profileCount} Zernio account(s).`);
    });
  }

  function loadCampaigns() {
    setMessage(null);
    startTransition(async () => {
      const res = await listZernioCampaignsAction();
      if (!res.success) {
        setMessage(res.error);
        return;
      }
      setCampaigns(res.data);
      setMessage(`Loaded ${res.data.length} campaign(s).`);
    });
  }

  function connectKey(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const res = await connectZernioWithApiKeyAction(formData);
      if (!res.success) {
        setMessage(res.error);
        return;
      }
      setMessage("Zernio connected for this business.");
      router.refresh();
    });
  }

  return (
    <Card className="border-white/[0.06]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Plug className="size-4 text-cyan-300" aria-hidden />
          Zernio (ads & social)
        </CardTitle>
        <CardDescription>
          Run ads across 14 platforms via{" "}
          <a
            href="https://docs.zernio.com/mcp"
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-300 underline"
          >
            Zernio
          </a>
          . Add <code className="text-xs">ZERNIO_API_KEY</code> to .env.local for server calls, or save a
          per-business key below. For Cursor MCP, see <code className="text-xs">.cursor/mcp.json</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!configured ? (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            ZERNIO_API_KEY is not set in the server env. You can still connect a per-business key below.
          </p>
        ) : null}

        {message ? (
          <p className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-muted-foreground">
            {message}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={testConnection}>
            Test env key
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={pending || !configured} onClick={loadCampaigns}>
            List campaigns
          </Button>
        </div>

        {campaigns.length > 0 ? (
          <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-muted-foreground">
            {campaigns.map((c, i) => (
              <li key={c._id ?? i}>
                {c.name ?? "Campaign"} · {c.platform ?? "—"} · {c.status ?? "—"}
              </li>
            ))}
          </ul>
        ) : null}

        <form
          className="space-y-3 rounded-xl border border-dashed border-white/10 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            connectKey(new FormData(e.currentTarget));
          }}
        >
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <KeyRound className="size-3.5" />
            Connect Zernio API key (per business)
          </p>
          <div className="space-y-2">
            <Label htmlFor="zernio-api-key">API key (sk_…)</Label>
            <Input id="zernio-api-key" name="api_key" type="password" placeholder="sk_…" required />
          </div>
          <Button type="submit" variant="gradient" className="w-full rounded-xl" disabled={pending}>
            Save connection
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
