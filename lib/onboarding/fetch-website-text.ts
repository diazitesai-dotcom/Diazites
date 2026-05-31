const MAX_BYTES = 500_000;
const MAX_TEXT_CHARS = 18_000;
const FETCH_TIMEOUT_MS = 12_000;

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

function stripHtmlToText(html: string): string {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");

  const withMeta = withoutScripts
    .replace(/<title[^>]*>([\s\S]*?)<\/title>/gi, " TITLE: $1 ")
    .replace(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/gi,
      " DESCRIPTION: $1 ",
    )
    .replace(
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["'][^>]*>/gi,
      " OG: $1 ",
    );

  const text = withMeta
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text.slice(0, MAX_TEXT_CHARS);
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
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      throw new Error(`Could not load website (HTTP ${res.status}).`);
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      throw new Error("Website did not return HTML content.");
    }

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > MAX_BYTES) {
      throw new Error("Website page is too large to analyze.");
    }

    const html = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
    const text = stripHtmlToText(html);
    if (text.length < 80) {
      throw new Error("Not enough readable content on that page.");
    }

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch?.[1]?.replace(/\s+/g, " ").trim();

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
