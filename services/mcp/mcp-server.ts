import type { SupabaseClient } from "@supabase/supabase-js";

import * as zernio from "@/lib/zernio";
import { createAdAccountRepository } from "@/repositories/ad-account.repository";
import { createAgentRepository } from "@/repositories/agent.repository";
import { createLeadRepository } from "@/repositories/lead.repository";
import { buildFunnelToolsForAuth, callFunnelMcpTool } from "@/services/mcp/mcp-funnel-tools";
import type { McpAuthContext } from "@/types/mcp";
import type { McpScope } from "@/utils/mcp-constants";

export type McpToolDef = {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
};

export type McpToolResult = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

type JsonRpcId = string | number | null;

export function buildToolsForAuth(ctx: McpAuthContext): McpToolDef[] {
  const tools: McpToolDef[] = [];

  if (ctx.scopes.includes("agents:read")) {
    tools.push({
      name: "diazites_agents_status",
      description:
        "List Diazites growth agents (social ads, search, landing page, etc.) and their activation status for this business.",
      inputSchema: { type: "object", properties: {} },
    });
  }

  if (ctx.scopes.includes("leads:read")) {
    tools.push({
      name: "diazites_leads_list",
      description: "List recent roofing leads for this business.",
      inputSchema: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Max rows (default 20, max 100)" },
        },
      },
    });
  }

  if (ctx.scopes.includes("leads:write")) {
    tools.push({
      name: "diazites_leads_create",
      description: "Create a new lead in the Diazites pipeline.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string" },
          phone: { type: "string" },
          email: { type: "string" },
          roofing_need: { type: "string" },
          notes: { type: "string" },
        },
        required: ["name"],
      },
    });
  }

  if (ctx.zernioBridgeEnabled && ctx.scopes.includes("zernio:read")) {
    tools.push(
      {
        name: "zernio_accounts_list",
        description:
          "List social/ad accounts connected in Zernio for this business (requires Zernio bridge + business API key on /dashboard/ads).",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "zernio_campaigns_list",
        description: "List ad campaigns from Zernio for this business.",
        inputSchema: { type: "object", properties: {} },
      },
    );
  }

  if (ctx.zernioBridgeEnabled && ctx.scopes.includes("zernio:write")) {
    tools.push({
      name: "zernio_posts_create",
      description:
        "Create a cross-platform post via Zernio. Pass JSON platforms array: [{\"platform\":\"twitter\",\"accountId\":\"...\"}].",
      inputSchema: {
        type: "object",
        properties: {
          content: { type: "string" },
          platforms: {
            type: "string",
            description: 'JSON array of { platform, accountId }',
          },
          publish_now: { type: "boolean" },
        },
        required: ["content", "platforms"],
      },
    }    );
  }

  return [...tools, ...buildFunnelToolsForAuth(ctx)];
}

export async function callMcpTool(
  client: SupabaseClient,
  ctx: McpAuthContext,
  name: string,
  args: Record<string, unknown>,
): Promise<McpToolResult> {
  try {
    const funnelResult = await callFunnelMcpTool(client, ctx, name, args);
    if (funnelResult) return funnelResult;

    switch (name) {
      case "diazites_agents_status":
        return await agentsStatus(client, ctx);
      case "diazites_leads_list":
        return await leadsList(client, ctx, args);
      case "diazites_leads_create":
        return await leadsCreate(client, ctx, args);
      case "zernio_accounts_list":
        return await zernioAccounts(client, ctx);
      case "zernio_campaigns_list":
        return await zernioCampaigns(client, ctx);
      case "zernio_posts_create":
        return await zernioCreatePost(client, ctx, args);
      default:
        return err(`Unknown tool: ${name}`);
    }
  } catch (e) {
    return err(e instanceof Error ? e.message : "Tool execution failed");
  }
}

export function handleMcpJsonRpc(
  client: SupabaseClient,
  ctx: McpAuthContext,
  body: unknown,
): Promise<{ status: number; body: unknown }> {
  const messages = Array.isArray(body) ? body : [body];
  const responses: unknown[] = [];

  return (async () => {
    for (const msg of messages) {
      if (!msg || typeof msg !== "object") continue;
      const rpc = msg as {
        jsonrpc?: string;
        id?: JsonRpcId;
        method?: string;
        params?: Record<string, unknown>;
      };

      if (rpc.jsonrpc !== "2.0" || !rpc.method) continue;

      if (rpc.method.startsWith("notifications/")) {
        continue;
      }

      const id = rpc.id ?? null;

      if (rpc.method === "initialize") {
        responses.push({
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {} },
            serverInfo: { name: "diazites-mcp", version: "1.0.0" },
          },
        });
        continue;
      }

      if (rpc.method === "tools/list") {
        responses.push({
          jsonrpc: "2.0",
          id,
          result: { tools: buildToolsForAuth(ctx) },
        });
        continue;
      }

      if (rpc.method === "tools/call") {
        const params = rpc.params ?? {};
        const toolName = String(params.name ?? "");
        const toolArgs =
          params.arguments && typeof params.arguments === "object"
            ? (params.arguments as Record<string, unknown>)
            : {};
        const result = await callMcpTool(client, ctx, toolName, toolArgs);
        responses.push({ jsonrpc: "2.0", id, result });
        continue;
      }

      responses.push({
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: `Method not found: ${rpc.method}` },
      });
    }

    if (responses.length === 0) {
      return { status: 202, body: null };
    }
    if (responses.length === 1) {
      return { status: 200, body: responses[0] };
    }
    return { status: 200, body: responses };
  })();
}

function hasScope(ctx: McpAuthContext, scope: McpScope): boolean {
  return ctx.scopes.includes(scope);
}

async function agentsStatus(client: SupabaseClient, ctx: McpAuthContext): Promise<McpToolResult> {
  if (!hasScope(ctx, "agents:read")) return err("Missing scope agents:read");

  const agents = createAgentRepository(client);
  const { data, error } = await agents.listByBusiness(ctx.businessId);
  if (error) return err(error.message);

  const allowed = new Set(ctx.allowedAgentTypes);
  const rows = (data ?? []).filter((a) =>
    allowed.has(a.agent_type as import("@/types/domain").AgentType),
  );
  return ok(
    JSON.stringify(
      {
        agents: rows.map((a) => ({
          agent_type: a.agent_type,
          status: a.status,
          activated_at: a.activated_at,
        })),
      },
      null,
      2,
    ),
  );
}

async function leadsList(
  client: SupabaseClient,
  ctx: McpAuthContext,
  args: Record<string, unknown>,
): Promise<McpToolResult> {
  if (!hasScope(ctx, "leads:read")) return err("Missing scope leads:read");

  const limit = Math.min(100, Math.max(1, Number(args.limit) || 20));
  const leads = createLeadRepository(client);
  const { data, error } = await leads.listByBusiness(ctx.businessId);
  if (error) return err(error.message);

  const slice = (data ?? []).slice(0, limit).map((l) => ({
    id: l.id,
    name: l.name,
    phone: l.phone,
    email: l.email,
    status: l.status,
    source: l.source,
    created_at: l.created_at,
  }));

  return ok(JSON.stringify({ leads: slice }, null, 2));
}

async function leadsCreate(
  client: SupabaseClient,
  ctx: McpAuthContext,
  args: Record<string, unknown>,
): Promise<McpToolResult> {
  if (!hasScope(ctx, "leads:write")) return err("Missing scope leads:write");

  const name = String(args.name ?? "").trim();
  if (!name) return err("name is required");

  const leads = createLeadRepository(client);
  const { data, error } = await leads.create({
    businessId: ctx.businessId,
    name,
    phone: args.phone ? String(args.phone) : null,
    email: args.email ? String(args.email) : null,
    roofingNeed: args.roofing_need ? String(args.roofing_need) : null,
    notes: args.notes ? String(args.notes) : null,
    source: "mcp",
  });

  if (error || !data) return err(error?.message ?? "Create failed");
  return ok(JSON.stringify({ leadId: data.id, status: data.status }, null, 2));
}

async function resolveZernioKey(
  client: SupabaseClient,
  businessId: string,
): Promise<string | null> {
  const accounts = createAdAccountRepository(client);
  const { data } = await accounts.getByPlatform(businessId, "zernio");
  if (!data || data.status !== "connected" || !data.access_token) return null;
  return data.access_token;
}

async function zernioAccounts(client: SupabaseClient, ctx: McpAuthContext): Promise<McpToolResult> {
  if (!ctx.zernioBridgeEnabled) return err("Zernio bridge is disabled for this connection");
  if (!hasScope(ctx, "zernio:read")) return err("Missing scope zernio:read");

  const key = await resolveZernioKey(client, ctx.businessId);
  if (!key) {
    return err("Zernio is not connected. Add an API key on /dashboard/ads.");
  }

  const accounts = await zernio.listAccounts(key);
  return ok(JSON.stringify({ accounts }, null, 2));
}

async function zernioCampaigns(client: SupabaseClient, ctx: McpAuthContext): Promise<McpToolResult> {
  if (!ctx.zernioBridgeEnabled) return err("Zernio bridge is disabled for this connection");
  if (!hasScope(ctx, "zernio:read")) return err("Missing scope zernio:read");

  const key = await resolveZernioKey(client, ctx.businessId);
  if (!key) {
    return err("Zernio is not connected. Add an API key on /dashboard/ads.");
  }

  const campaigns = await zernio.listAdCampaigns(key);
  return ok(JSON.stringify({ campaigns }, null, 2));
}

async function zernioCreatePost(
  client: SupabaseClient,
  ctx: McpAuthContext,
  args: Record<string, unknown>,
): Promise<McpToolResult> {
  if (!ctx.zernioBridgeEnabled) return err("Zernio bridge is disabled for this connection");
  if (!hasScope(ctx, "zernio:write")) return err("Missing scope zernio:write");

  const key = await resolveZernioKey(client, ctx.businessId);
  if (!key) {
    return err("Zernio is not connected. Add an API key on /dashboard/ads.");
  }

  const content = String(args.content ?? "").trim();
  if (!content) return err("content is required");

  let platforms: zernio.ZernioCreatePostInput["platforms"];
  try {
    const parsed = JSON.parse(String(args.platforms ?? "[]")) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return err("platforms must be a non-empty JSON array");
    }
    platforms = parsed.map((p) => ({
      platform: String((p as { platform?: string }).platform) as zernio.ZernioPlatform,
      accountId: String((p as { accountId?: string }).accountId),
    }));
  } catch {
    return err("platforms must be valid JSON");
  }

  const post = await zernio.createPost(key, {
    content,
    platforms,
    publishNow: Boolean(args.publish_now),
  });

  return ok(JSON.stringify({ postId: post._id, status: post.status }, null, 2));
}

function ok(text: string): McpToolResult {
  return { content: [{ type: "text", text }] };
}

function err(message: string): McpToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}
