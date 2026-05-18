import { ZERNIO_MCP_URL } from "@/utils/mcp-constants";

export type AgentMcpDocClient = "hermes" | "openclaw" | "cursor" | "claude" | "custom";

export type AgentMcpDocSection = {
  id: AgentMcpDocClient;
  title: string;
  summary: string;
  configPath: string;
  zernioSnippet: string;
  diazitesSnippet: (mcpEndpoint: string) => string;
  steps: string[];
  externalDocs?: { label: string; href: string }[];
};

export function getAgentMcpDocSections(mcpEndpoint: string): AgentMcpDocSection[] {
  const zernioJson = JSON.stringify(
    {
      zernio: {
        type: "http",
        url: ZERNIO_MCP_URL,
        headers: { Authorization: "Bearer YOUR_ZERNIO_API_KEY" },
      },
    },
    null,
    2,
  );

  const hermesZernio = `mcp_servers:
  zernio:
    url: "${ZERNIO_MCP_URL}"
    headers:
      Authorization: "Bearer YOUR_ZERNIO_API_KEY"
    timeout: 180
    connect_timeout: 60
    enabled: true`;

  const hermesDiazites = (endpoint: string) => `mcp_servers:
  diazites:
    url: "${endpoint}"
    headers:
      Authorization: "Bearer YOUR_DIAZ_MCP_TOKEN"
    timeout: 120
    enabled: true`;

  const cursorZernio = JSON.stringify(
    {
      zernio: {
        type: "http",
        url: ZERNIO_MCP_URL,
        headers: { Authorization: "Bearer YOUR_ZERNIO_API_KEY" },
      },
    },
    null,
    2,
  );

  const claudeRemote = `{
  "mcpServers": {
    "zernio": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote@latest",
        "${ZERNIO_MCP_URL}",
        "--header",
        "Authorization: Bearer YOUR_ZERNIO_API_KEY"
      ]
    }
  }
}`;

  return [
    {
      id: "hermes",
      title: "Hermes Agent",
      summary: "Add Zernio (and optional Diazites) to ~/.hermes/config.yaml.",
      configPath: "~/.hermes/config.yaml",
      zernioSnippet: hermesZernio,
      diazitesSnippet: hermesDiazites,
      steps: [
        "Create a Zernio API key at zernio.com/dashboard/api-keys (sk_…).",
        "Connect social accounts at zernio.com.",
        "Paste the Zernio block below into mcp_servers in ~/.hermes/config.yaml.",
        "Optional: generate a Diazites token on this page and add the diazites block.",
        "Restart Hermes, then ask: “Call accounts_list on Zernio.”",
      ],
      externalDocs: [
        {
          label: "Hermes MCP guide",
          href: "https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp",
        },
        {
          label: "Hermes config reference",
          href: "https://hermes-agent.nousresearch.com/docs/reference/mcp-config-reference",
        },
        { label: "Zernio MCP docs", href: "https://docs.zernio.com/mcp" },
      ],
    },
    {
      id: "openclaw",
      title: "OpenClaw",
      summary: "Point OpenClaw at the hosted Zernio MCP URL with a Bearer API key.",
      configPath: "OpenClaw MCP settings (see OpenClaw docs)",
      zernioSnippet: zernioJson,
      diazitesSnippet: (endpoint) =>
        JSON.stringify(
          {
            diazites: {
              type: "http",
              url: endpoint,
              headers: { Authorization: "Bearer YOUR_DIAZ_MCP_TOKEN" },
            },
          },
          null,
          2,
        ),
      steps: [
        "Get a Zernio API key from zernio.com/dashboard/api-keys.",
        "In OpenClaw MCP configuration, add an HTTP server with the JSON below.",
        "Set Authorization to Bearer plus your sk_… key.",
        "Optional: add Diazites MCP using a token generated on this page.",
      ],
    },
    {
      id: "cursor",
      title: "Cursor",
      summary: "Add .cursor/mcp.json in your project (or user MCP settings).",
      configPath: ".cursor/mcp.json (project root)",
      zernioSnippet: cursorZernio,
      diazitesSnippet: (endpoint) =>
        JSON.stringify(
          {
            diazites: {
              type: "http",
              url: endpoint,
              headers: { Authorization: "Bearer YOUR_DIAZ_MCP_TOKEN" },
            },
          },
          null,
          2,
        ),
      steps: [
        "Create a Zernio API key at zernio.com/dashboard/api-keys.",
        "Add the JSON below to .cursor/mcp.json in the project root.",
        "Restart Cursor or reload MCP servers from settings.",
        "In chat, ask Cursor to use Zernio tools (e.g. list connected accounts).",
      ],
      externalDocs: [{ label: "Zernio MCP docs", href: "https://docs.zernio.com/mcp" }],
    },
    {
      id: "claude",
      title: "Claude Desktop",
      summary: "Use Settings → Connectors, or mcp-remote in claude_desktop_config.json.",
      configPath: "%APPDATA%\\Claude\\claude_desktop_config.json (Windows)",
      zernioSnippet: claudeRemote,
      diazitesSnippet: (endpoint) =>
        `Settings → Connectors → Add custom connector
Name: Diazites
URL: ${endpoint}
Authentication: Bearer → YOUR_DIAZ_MCP_TOKEN`,
      steps: [
        "Preferred: Claude Desktop → Settings → Connectors → Add custom connector.",
        "Name: Zernio, URL: https://mcp.zernio.com/mcp, Auth: Bearer + sk_… key.",
        "Or use the mcp-remote JSON below in claude_desktop_config.json.",
        "Restart Claude Desktop completely after saving.",
      ],
      externalDocs: [{ label: "Zernio MCP docs", href: "https://docs.zernio.com/mcp" }],
    },
    {
      id: "custom",
      title: "Any MCP client",
      summary: "Any HTTP MCP client can use the same URL and Bearer token pattern.",
      configPath: "Your client’s MCP / HTTP tools config",
      zernioSnippet: `URL: ${ZERNIO_MCP_URL}
Header: Authorization: Bearer YOUR_ZERNIO_API_KEY`,
      diazitesSnippet: (endpoint) => `URL: ${endpoint}
Header: Authorization: Bearer YOUR_DIAZ_MCP_TOKEN`,
      steps: [
        "Zernio: HTTP POST/Streamable MCP at mcp.zernio.com with Bearer sk_… key.",
        "Diazites: HTTP MCP at your app /api/mcp with Bearer diaz_mcp_… token.",
        "Generate Diazites tokens below; enable Zernio bridge to use your Ads API key.",
      ],
    },
  ];
}

export const MCP_DOC_FAQ = [
  {
    q: "Zernio vs Diazites MCP?",
    a: "Zernio MCP gives full social/ads/inbox tools (280+). Diazites MCP exposes your workspace agents, leads, and optional Zernio bridge per business.",
  },
  {
    q: "Invalid API key on Zernio",
    a: "Re-copy sk_… from zernio.com/dashboard/api-keys with no spaces. Connect accounts at zernio.com first.",
  },
  {
    q: "Hermes does not list tools",
    a: "Restart Hermes after editing config.yaml. Confirm enabled: true and the exact URL https://mcp.zernio.com/mcp.",
  },
  {
    q: "Token generation fails",
    a: "Run Supabase migration 014_agent_mcp_connections.sql, then refresh this page.",
  },
] as const;
