import { AGENTS } from "@/utils/constants";

export const MCP_CLIENT_TYPES = [
  { key: "openclaw", name: "OpenClaw" },
  { key: "hermes", name: "Hermes Agent" },
  { key: "cursor", name: "Cursor" },
  { key: "windsurf", name: "Windsurf" },
  { key: "claude", name: "Claude Desktop" },
  { key: "custom", name: "Custom MCP client" },
] as const;

export type McpClientType = (typeof MCP_CLIENT_TYPES)[number]["key"];

export const MCP_SCOPES = [
  { key: "agents:read", label: "Read agent status" },
  { key: "leads:read", label: "List leads" },
  { key: "leads:write", label: "Create leads" },
  { key: "campaigns:read", label: "List campaigns" },
  { key: "zernio:read", label: "Zernio accounts & campaigns (read)" },
  { key: "zernio:write", label: "Zernio posts (write)" },
  { key: "automations:trigger", label: "Fire automation webhooks" },
] as const;

export type McpScope = (typeof MCP_SCOPES)[number]["key"];

export const DEFAULT_MCP_SCOPES: McpScope[] = ["agents:read", "leads:read"];

export const AGENT_TYPE_OPTIONS = AGENTS.map((a) => ({
  key: a.key,
  label: a.name,
}));

export const ZERNIO_MCP_URL = "https://mcp.zernio.com/mcp";
