import { createHash, randomBytes } from "crypto";

const TOKEN_PREFIX = "diaz_mcp_";

export function generateMcpToken(): { plain: string; hash: string; displayPrefix: string } {
  const secret = randomBytes(24).toString("hex");
  const plain = `${TOKEN_PREFIX}${secret}`;
  const hash = hashMcpToken(plain);
  const displayPrefix = `${plain.slice(0, TOKEN_PREFIX.length + 8)}…`;
  return { plain, hash, displayPrefix };
}

export function hashMcpToken(plain: string): string {
  return createHash("sha256").update(plain, "utf8").digest("hex");
}

export function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() ?? null;
}
