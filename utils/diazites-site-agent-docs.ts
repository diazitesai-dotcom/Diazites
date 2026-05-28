import { MCP_SCOPES, ZERNIO_MCP_URL } from "@/utils/mcp-constants";

/** Public documentation: how external agents connect to the Diazites site via MCP. */

export const DIAZITES_MCP_PROTOCOL = "2024-11-05";

export const DIAZITES_MCP_TOOLS = [
  {
    name: "diazites_agents_status",
    scope: "agents:read",
    description: "List growth agents (social ads, search, landing page, etc.) and activation status.",
  },
  {
    name: "diazites_leads_list",
    scope: "leads:read",
    description: "List recent leads. Optional: limit (max 100).",
  },
  {
    name: "diazites_leads_create",
    scope: "leads:write",
    description: "Create a lead. Required: name. Optional: phone, email, roofing_need, notes.",
  },
  {
    name: "diazites_funnel_run_full",
    scope: "funnel:write (+ agents:write recommended)",
    description:
      "Build full funnel: generate 3 landing pages, publish, activate agents, start growth engine from a URL or prompt.",
  },
  {
    name: "diazites_funnel_generate",
    scope: "funnel:write",
    description: "Generate 3 AI landing page variants (Dashboard → Funnel parity).",
  },
  {
    name: "diazites_funnel_list",
    scope: "funnel:read",
    description: "List landing pages, slugs, and public URLs.",
  },
  {
    name: "diazites_funnel_publish",
    scope: "funnel:write",
    description: "Publish a landing page version to /p/{slug}.",
  },
  {
    name: "diazites_agents_activate",
    scope: "agents:write",
    description: "Activate growth agents (landing, ads, qualification, etc.).",
  },
  {
    name: "diazites_campaigns_list",
    scope: "campaigns:read",
    description: "List campaigns for the business.",
  },
  {
    name: "diazites_growth_engine_start",
    scope: "funnel:write",
    description: "Start a growth engine run from a website URL.",
  },
  {
    name: "zernio_accounts_list",
    scope: "zernio:read + bridge",
    description: "List Zernio-connected social/ad accounts (requires Zernio bridge + Ads API key).",
  },
  {
    name: "zernio_campaigns_list",
    scope: "zernio:read + bridge",
    description: "List Zernio ad campaigns for the business.",
  },
  {
    name: "zernio_posts_create",
    scope: "zernio:write + bridge",
    description: "Cross-post via Zernio. Required: content, platforms (JSON array).",
  },
] as const;

export function getDiazitesMcpClientExamples(baseUrl: string) {
  const mcpUrl = `${baseUrl.replace(/\/$/, "")}/api/mcp`;

  return {
    mcpUrl,
    hermes: `mcp_servers:
  diazites:
    url: "${mcpUrl}"
    headers:
      Authorization: "Bearer YOUR_DIAZ_MCP_TOKEN"
    timeout: 120
    enabled: true`,
    cursor: JSON.stringify(
      {
        diazites: {
          type: "http",
          url: mcpUrl,
          headers: { Authorization: "Bearer YOUR_DIAZ_MCP_TOKEN" },
        },
      },
      null,
      2,
    ),
    http: `POST ${mcpUrl}
Authorization: Bearer YOUR_DIAZ_MCP_TOKEN
Content-Type: application/json

{"jsonrpc":"2.0","id":1,"method":"tools/list"}`,
    zernioNote: `For full social/ads (280+ tools), connect directly to Zernio MCP at ${ZERNIO_MCP_URL} with your Zernio API key — see https://docs.zernio.com/mcp`,
  };
}

export const CONNECT_STEPS = [
  {
    title: "Create a Diazites account",
    body: "Sign up at the site and complete business setup so agents are scoped to your roofing business.",
  },
  {
    title: "Generate an MCP token",
    body: "Log in → Dashboard → Agent Manager → Generate agent connection token. Choose client type (Hermes, OpenClaw, etc.), agent access, and scopes. Copy the diaz_mcp_… token — it is shown once.",
  },
  {
    title: "Configure your agent",
    body: "Point your MCP client at the Diazites MCP URL with Authorization: Bearer <token>. Use the examples on this page.",
  },
  {
    title: "Call tools",
    body: "Use MCP tools/list then tools/call. Tokens only access agents and data you selected when creating the connection.",
  },
] as const;

export const MCP_JSONRPC_EXAMPLES = {
  initialize: {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: DIAZITES_MCP_PROTOCOL,
      capabilities: {},
      clientInfo: { name: "hermes", version: "1.0.0" },
    },
  },
  toolsList: { jsonrpc: "2.0", id: 2, method: "tools/list" },
  toolsCall: {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "diazites_leads_list",
      arguments: { limit: 10 },
    },
  },
} as const;

export { MCP_SCOPES, ZERNIO_MCP_URL };
