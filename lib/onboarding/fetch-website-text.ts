const READ_BYTES = 350_000;
const MAX_TEXT_CHARS = 18_000;
const FETCH_TIMEOUT_MS = 15_000;

const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "[::1]",
]);

function normalizeWebsiteUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const host = url.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host)) return null;
  if (host.endsWith(".local") || host.endsWith(".internal")) return null;
  if (/^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\./.test(host)) return null;

  return url.toString();
}

/** Read only the first N bytes so large pages still work for autofill. */
async function readResponsePrefix(
  response: Response,
  maxBytes: number,
): Promise<ArrayBuffer> {
  const body = response.body;
  if (!body) {
    const buf = await response.arrayBuffer();
    return buf.byteLength <= maxBytes ? buf : buf.slice(0, maxBytes);
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (total < maxBytes) {
      const { done, value } = await reader.read();
      if (done || !value) break;

      const remaining = maxBytes - total;
      if (value.byteLength <= remaining) {
        chunks.push(value);
        total += value.byteLength;
      } else {
        chunks.push(value.slice(0, remaining));
        total = maxBytes;
        break;
      }
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
      /* ignore */
    }
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged.buffer;
}

/** Prefer head + early body — enough for title, meta, and hero copy. */
function extractAutofillHtml(html: string): string {
  const headMatch = html.match(/<head[\s\S]*?<\/head>/i);
  const head = headMatch?.[0] ?? html.slice(0, 40_000);

  const headEnd = html.search(/<\/head>/i);
  const bodyStart = headEnd >= 0 ? headEnd + 7 : 0;
  const bodySnippet = html.slice(bodyStart, bodyStart + 100_000);

  return `${head}\n${bodySnippet}`;
}

function metaContent(html: string, key: string): string | undefined {
  const patterns = [
    new RegExp(
      `<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']*)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${key}["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+property=["']og:${key}["'][^>]+content=["']([^"']*)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:${key}["']`,
      "i",
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return undefined;
}

function stripHtmlToText(html: string): string {
  const focused = extractAutofillHtml(html);

  const withoutScripts = focused
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ");

  const description =
    metaContent(focused, "description") ?? metaContent(focused, "og:description");
  const siteName = metaContent(focused, "site_name");

  const withMeta = withoutScripts
    .replace(/<title[^>]*>([\s\S]*?)<\/title>/gi, " TITLE: $1 ")
    .replace(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/gi,
      " DESCRIPTION: $1 ",
    )
    .replace(
      /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/gi,
      " DESCRIPTION: $1 ",
    )
    .replace(
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["'][^>]*>/gi,
      " OG: $1 ",
    )
    .replace(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
      " SCHEMA: $1 ",
    );

  const prefix = [
    description ? `DESCRIPTION: ${description}` : "",
    siteName ? `SITE: ${siteName}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const text = withMeta
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return `${prefix} ${text}`.trim().slice(0, MAX_TEXT_CHARS);
}

export async function fetchWebsiteText(rawUrl: string): Promise<{
  url: string;
  text: string;
  title?: string;
}> {
  const url = normalizeWebsiteUrl(rawUrl);
  if (!url) {
    throw new Error("Enter a valid public website URL (https://…).");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "DiazitesBot/1.0 (+https://www.diazites.com; onboarding-autofill)",
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      throw new Error(`Could not load website (HTTP ${res.status}).`);
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (
      contentType &&
      !contentType.includes("text/html") &&
      !contentType.includes("text/plain") &&
      !contentType.includes("application/xhtml")
    ) {
      throw new Error("Website did not return HTML content.");
    }

    const buffer = await readResponsePrefix(res, READ_BYTES);
    const html = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
    const text = stripHtmlToText(html);

    if (text.length < 40) {
      throw new Error(
        "Not enough readable content on that page — try the full URL including https://.",
      );
    }

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title =
      titleMatch?.[1]?.replace(/\s+/g, " ").trim() ??
      metaContent(html, "title") ??
      metaContent(html, "site_name");

    return { url, text, title };
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("Website took too long to respond.");
    }
    throw e instanceof Error ? e : new Error("Failed to fetch website.");
  } finally {
    clearTimeout(timer);
  }
}

export { normalizeWebsiteUrl };
