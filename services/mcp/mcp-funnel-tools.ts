import type { SupabaseClient } from "@supabase/supabase-js";

import { getPublicAppUrl } from "@/lib/env";
import { isValidFunnelInput, parseFunnelInput } from "@/lib/funnel/parse-funnel-input";
import { createBusinessRepository } from "@/repositories/business.repository";
import { createCampaignRepository } from "@/repositories/campaign.repository";
import { activateAgent, deactivateAgent } from "@/services/agents/agent.service";
import { generateAndSaveThreeLandingPages } from "@/services/funnel/funnel-ai-generator.service";
import { startGrowthEngineRun, listGrowthEngineRuns } from "@/services/growth-engine/growth-engine.service";
import {
  listLandingPagesForBusiness,
  publishLandingPage,
} from "@/services/landing/landing-page-editor.service";
import type { McpAuthContext } from "@/types/mcp";
import type { AgentType } from "@/types/domain";
import { AGENTS } from "@/utils/constants";

export type McpToolDef = {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
};

type McpToolResult = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

function ok(text: string): McpToolResult {
  return { content: [{ type: "text", text }] };
}

function err(message: string): McpToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}

async function resolveOwnerUserId(
  client: SupabaseClient,
  businessId: string,
): Promise<{ userId: string } | { error: string }> {
  const businesses = createBusinessRepository(client);
  const { data } = await businesses.getById(businessId);
  if (!data?.user_id) return { error: "Business not found for this token" };
  return { userId: data.user_id };
}

function agentAllowed(ctx: McpAuthContext, agentType: AgentType): boolean {
  return ctx.allowedAgentTypes.includes(agentType);
}

export function buildFunnelToolsForAuth(ctx: McpAuthContext): McpToolDef[] {
  const tools: McpToolDef[] = [];

  if (ctx.scopes.includes("funnel:read")) {
    tools.push(
      {
        name: "diazites_funnel_list",
        description:
          "List landing pages and variants for this business (slug, status, headlines).",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "diazites_growth_engine_list",
        description: "List recent growth engine runs and stages.",
        inputSchema: {
          type: "object",
          properties: {
            limit: { type: "number", description: "Max rows (default 10)" },
          },
        },
      },
    );
  }

  if (ctx.scopes.includes("campaigns:read")) {
    tools.push({
      name: "diazites_campaigns_list",
      description: "List marketing campaigns for this business.",
      inputSchema: { type: "object", properties: {} },
    });
  }

  if (ctx.scopes.includes("funnel:write")) {
    tools.push(
      {
        name: "diazites_funnel_generate",
        description:
          "AI-generate 3 landing page variants from a URL, keyword, or business description (same as Dashboard → Funnel).",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "e.g. https://www.example.com or 'roofing leads Tampa'",
            },
          },
          required: ["prompt"],
        },
      },
      {
        name: "diazites_funnel_publish",
        description: "Publish a landing page version (makes it live at /p/{slug}).",
        inputSchema: {
          type: "object",
          properties: {
            landing_page_id: { type: "string" },
            version_id: { type: "string" },
          },
          required: ["landing_page_id", "version_id"],
        },
      },
      {
        name: "diazites_growth_engine_start",
        description: "Start a growth engine run from a website URL.",
        inputSchema: {
          type: "object",
          properties: {
            input_url: { type: "string", description: "Website URL to analyze" },
          },
          required: ["input_url"],
        },
      },
      {
        name: "diazites_funnel_run_full",
        description:
          "End-to-end funnel: generate 3 landing pages, optionally publish them, activate allowed agents, and start growth engine. Best for 'build full funnel for {site}'.",
        inputSchema: {
          type: "object",
          properties: {
            prompt: { type: "string", description: "URL or business description" },
            publish_pages: { type: "boolean", description: "Publish all generated pages (default true)" },
            activate_agents: {
              type: "boolean",
              description: "Activate all token-allowed agents (default true)",
            },
            start_growth_engine: {
              type: "boolean",
              description: "Start growth engine from URL if prompt is a URL (default true)",
            },
          },
          required: ["prompt"],
        },
      },
    );
  }

  if (ctx.scopes.includes("agents:write")) {
    tools.push(
      {
        name: "diazites_agents_activate",
        description:
          "Activate one or more Diazites agents (provisions automations). Pass agent_types array or single agent_type.",
        inputSchema: {
          type: "object",
          properties: {
            agent_type: { type: "string" },
            agent_types: {
              type: "array",
              items: { type: "string" },
              description: "e.g. landing_page, social_ads, lead_qualification",
            },
          },
        },
      },
      {
        name: "diazites_agents_deactivate",
        description: "Deactivate agent(s). Same agent_type / agent_types shape as activate.",
        inputSchema: {
          type: "object",
          properties: {
            agent_type: { type: "string" },
            agent_types: { type: "array", items: { type: "string" } },
          },
        },
      },
    );
  }

  if (ctx.scopes.includes("campaigns:write")) {
    tools.push({
      name: "diazites_campaigns_create",
      description: "Create a draft campaign linked to this business.",
      inputSchema: {
        type: "object",
        properties: {
          platform: { type: "string", description: "e.g. meta, google, multi" },
          goal: { type: "string" },
          location: { type: "string" },
          budget: { type: "number" },
          landing_page_id: { type: "string" },
        },
        required: ["platform"],
      },
    });
  }

  return tools;
}

export async function callFunnelMcpTool(
  client: SupabaseClient,
  ctx: McpAuthContext,
  name: string,
  args: Record<string, unknown>,
): Promise<McpToolResult | null> {
  switch (name) {
    case "diazites_funnel_list":
      return funnelList(client, ctx);
    case "diazites_funnel_generate":
      return funnelGenerate(client, ctx, args);
    case "diazites_funnel_publish":
      return funnelPublish(client, ctx, args);
    case "diazites_funnel_run_full":
      return funnelRunFull(client, ctx, args);
    case "diazites_campaigns_list":
      return campaignsList(client, ctx);
    case "diazites_campaigns_create":
      return campaignsCreate(client, ctx, args);
    case "diazites_growth_engine_start":
      return growthEngineStart(client, ctx, args);
    case "diazites_growth_engine_list":
      return growthEngineList(client, ctx, args);
    case "diazites_agents_activate":
      return agentsActivate(client, ctx, args);
    case "diazites_agents_deactivate":
      return agentsDeactivate(client, ctx, args);
    default:
      return null;
  }
}

async function funnelList(client: SupabaseClient, ctx: McpAuthContext): Promise<McpToolResult> {
  const owner = await resolveOwnerUserId(client, ctx.businessId);
  if ("error" in owner) return err(owner.error);

  const result = await listLandingPagesForBusiness(client, owner.userId, ctx.businessId);
  if (!result.success) return err(result.error);

  const base = getPublicAppUrl();
  const pages = (result.data as Array<Record<string, unknown>>).map((p) => ({
    id: p.id,
    slug: p.slug,
    headline: p.headline,
    page_status: p.page_status,
    published: p.published,
    public_url: p.slug ? `${base}/p/${p.slug}` : null,
    versions: Array.isArray(p.versions)
      ? (p.versions as Array<Record<string, unknown>>).map((v) => ({
          id: v.id,
          name: v.name,
          version_label: v.version_label,
        }))
      : [],
  }));

  return ok(JSON.stringify({ landing_pages: pages }, null, 2));
}

async function funnelGenerate(
  client: SupabaseClient,
  ctx: McpAuthContext,
  args: Record<string, unknown>,
): Promise<McpToolResult> {
  const prompt = String(args.prompt ?? "").trim();
  if (!prompt) return err("prompt is required");

  const parsed = parseFunnelInput(prompt);
  if (!isValidFunnelInput(parsed)) {
    return err(
      parsed.kind === "url"
        ? "Invalid URL — use domain.com or https://domain.com"
        : "Prompt must be at least 3 characters",
    );
  }

  const owner = await resolveOwnerUserId(client, ctx.businessId);
  if ("error" in owner) return err(owner.error);

  const result = await generateAndSaveThreeLandingPages(
    client,
    owner.userId,
    ctx.businessId,
    prompt,
  );
  if (!result.success) return err(result.error);

  const base = getPublicAppUrl();
  return ok(
    JSON.stringify(
      {
        used_ai: result.data.usedAi,
        pages: result.data.pages.map((p) => ({
          ...p,
          preview_url: `${base}/dashboard/funnel/preview/${p.slug}`,
          public_url_after_publish: `${base}/p/${p.slug}`,
        })),
      },
      null,
      2,
    ),
  );
}

async function funnelPublish(
  client: SupabaseClient,
  ctx: McpAuthContext,
  args: Record<string, unknown>,
): Promise<McpToolResult> {
  const landingPageId = String(args.landing_page_id ?? "").trim();
  const versionId = String(args.version_id ?? "").trim();
  if (!landingPageId || !versionId) return err("landing_page_id and version_id are required");

  const owner = await resolveOwnerUserId(client, ctx.businessId);
  if ("error" in owner) return err(owner.error);

  const result = await publishLandingPage(
    client,
    owner.userId,
    ctx.businessId,
    landingPageId,
    versionId,
  );
  if (!result.success) return err(result.error);

  return ok(
    JSON.stringify(
      { slug: result.data.slug, public_url: `${getPublicAppUrl()}/p/${result.data.slug}` },
      null,
      2,
    ),
  );
}

async function funnelRunFull(
  client: SupabaseClient,
  ctx: McpAuthContext,
  args: Record<string, unknown>,
): Promise<McpToolResult> {
  const prompt = String(args.prompt ?? "").trim();
  if (!prompt) return err("prompt is required");

  const publishPages = args.publish_pages !== false;
  const activateAgents = args.activate_agents !== false;
  const startGrowth = args.start_growth_engine !== false;

  const summary: Record<string, unknown> = { prompt };

  const gen = await funnelGenerate(client, ctx, { prompt });
  if (gen.isError) return gen;

  const genData = JSON.parse(gen.content[0]!.text) as {
    pages: Array<{
      landingPageId: string;
      draftVersionId: string;
      slug: string;
    }>;
  };
  summary.generated = genData.pages;

  if (publishPages) {
    const published: unknown[] = [];
    for (const page of genData.pages) {
      const pub = await funnelPublish(client, ctx, {
        landing_page_id: page.landingPageId,
        version_id: page.draftVersionId,
      });
      published.push(
        pub.isError
          ? { slug: page.slug, error: pub.content[0]?.text }
          : JSON.parse(pub.content[0]!.text),
      );
    }
    summary.published = published;
  }

  if (activateAgents && ctx.scopes.includes("agents:write")) {
    const types = ctx.allowedAgentTypes.length > 0 ? ctx.allowedAgentTypes : AGENTS.map((a) => a.key);
    const act = await agentsActivate(client, ctx, { agent_types: types });
    summary.agents = act.isError ? { error: act.content[0]?.text } : JSON.parse(act.content[0]!.text);
  } else if (activateAgents) {
    summary.agents = { skipped: "Token missing agents:write scope" };
  }

  const parsed = parseFunnelInput(prompt);
  if (startGrowth && parsed.kind === "url" && ctx.scopes.includes("funnel:write")) {
    const inputUrl = /^https?:\/\//i.test(prompt)
      ? prompt
      : `https://${parsed.domain ?? prompt}`;
    const run = await growthEngineStart(client, ctx, { input_url: inputUrl });
    summary.growth_engine = run.isError
      ? { error: run.content[0]?.text }
      : JSON.parse(run.content[0]!.text);
  }

  return ok(JSON.stringify(summary, null, 2));
}

async function campaignsList(client: SupabaseClient, ctx: McpAuthContext): Promise<McpToolResult> {
  const campaigns = createCampaignRepository(client);
  const { data, error } = await campaigns.listByBusiness(ctx.businessId);
  if (error) return err(error.message);
  return ok(JSON.stringify({ campaigns: data ?? [] }, null, 2));
}

async function campaignsCreate(
  client: SupabaseClient,
  ctx: McpAuthContext,
  args: Record<string, unknown>,
): Promise<McpToolResult> {
  const platform = String(args.platform ?? "multi").trim();
  const campaigns = createCampaignRepository(client);
  const { data, error } = await campaigns.create({
    businessId: ctx.businessId,
    platform,
    goal: args.goal ? String(args.goal) : null,
    location: args.location ? String(args.location) : null,
    budget: typeof args.budget === "number" ? args.budget : 0,
    status: "draft",
  });
  if (error || !data) return err(error?.message ?? "Create failed");

  if (args.landing_page_id) {
    await client
      .from("campaigns")
      .update({ landing_page_id: String(args.landing_page_id) })
      .eq("id", data.id);
  }

  return ok(JSON.stringify({ campaign: data }, null, 2));
}

async function growthEngineStart(
  client: SupabaseClient,
  ctx: McpAuthContext,
  args: Record<string, unknown>,
): Promise<McpToolResult> {
  const inputUrl = String(args.input_url ?? "").trim();
  if (!inputUrl) return err("input_url is required");

  const owner = await resolveOwnerUserId(client, ctx.businessId);
  if ("error" in owner) return err(owner.error);

  const result = await startGrowthEngineRun(client, owner.userId, ctx.businessId, inputUrl);
  if (!result.success) return err(result.error);
  return ok(JSON.stringify({ run_id: result.data.runId }, null, 2));
}

async function growthEngineList(
  client: SupabaseClient,
  ctx: McpAuthContext,
  args: Record<string, unknown>,
): Promise<McpToolResult> {
  const limit = Math.min(20, Math.max(1, Number(args.limit) || 10));
  const owner = await resolveOwnerUserId(client, ctx.businessId);
  if ("error" in owner) return err(owner.error);

  const result = await listGrowthEngineRuns(client, owner.userId, ctx.businessId);
  if (!result.success) return err(result.error);

  const runs = (result.data as unknown[]).slice(0, limit);
  return ok(JSON.stringify({ runs }, null, 2));
}

function parseAgentTypes(args: Record<string, unknown>): AgentType[] {
  const single = args.agent_type ? String(args.agent_type) : "";
  const many = Array.isArray(args.agent_types)
    ? args.agent_types.map((v) => String(v))
    : [];
  const raw = single ? [single, ...many] : many;
  const valid = new Set(AGENTS.map((a) => a.key));
  return [...new Set(raw.filter((t) => valid.has(t as AgentType)))] as AgentType[];
}

async function agentsActivate(
  client: SupabaseClient,
  ctx: McpAuthContext,
  args: Record<string, unknown>,
): Promise<McpToolResult> {
  const types = parseAgentTypes(args);
  if (types.length === 0) return err("Provide agent_type or agent_types");

  const owner = await resolveOwnerUserId(client, ctx.businessId);
  if ("error" in owner) return err(owner.error);

  const activated: AgentType[] = [];
  const errors: string[] = [];

  for (const agentType of types) {
    if (!agentAllowed(ctx, agentType)) {
      errors.push(`${agentType}: not allowed on this token`);
      continue;
    }
    const result = await activateAgent(client, owner.userId, agentType);
    if (result.success) activated.push(agentType);
    else errors.push(`${agentType}: ${result.error}`);
  }

  return ok(JSON.stringify({ activated, errors }, null, 2));
}

async function agentsDeactivate(
  client: SupabaseClient,
  ctx: McpAuthContext,
  args: Record<string, unknown>,
): Promise<McpToolResult> {
  const types = parseAgentTypes(args);
  if (types.length === 0) return err("Provide agent_type or agent_types");

  const owner = await resolveOwnerUserId(client, ctx.businessId);
  if ("error" in owner) return err(owner.error);

  const deactivated: AgentType[] = [];
  const errors: string[] = [];

  for (const agentType of types) {
    if (!agentAllowed(ctx, agentType)) {
      errors.push(`${agentType}: not allowed on this token`);
      continue;
    }
    const result = await deactivateAgent(client, owner.userId, agentType);
    if (result.success) deactivated.push(agentType);
    else errors.push(`${agentType}: ${result.error}`);
  }

  return ok(JSON.stringify({ deactivated, errors }, null, 2));
}
