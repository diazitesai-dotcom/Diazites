function getEnv(name: string, fallback = ""): string {
  const value = process.env[name];
  return value ?? fallback;
}

/**
 * Canonical browser-facing origin (auth email links, Stripe return URLs).
 * Prefer setting `NEXT_PUBLIC_APP_URL` in Vercel (e.g. https://your-domain.com).
 * On Vercel, `VERCEL_URL` is used when the public URL env is unset (often *.vercel.app).
 */
export function getPublicAppUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//i, "").replace(/\/$/, "");
    return `https://${host}`;
  }
  return "http://localhost:3000";
}

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: getEnv("NEXT_PUBLIC_SUPABASE_URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_KEY: getEnv("SUPABASE_SERVICE_KEY"),
  RESEND_API_KEY: getEnv("RESEND_API_KEY"),
  OPENAI_API_KEY: getEnv("OPENAI_API_KEY"),
  /** Comma-separated admin emails for agent/onboarding alerts via Resend */
  ADMIN_NOTIFICATION_EMAILS: getEnv("ADMIN_NOTIFICATION_EMAILS"),
  RESEND_FROM_EMAIL: getEnv("RESEND_FROM_EMAIL", "Diazites AI <noreply@diazites.com>"),
  /** Stripe — omit keys until you are ready for live charges */
  STRIPE_SECRET_KEY: getEnv("STRIPE_SECRET_KEY"),
  STRIPE_WEBHOOK_SECRET: getEnv("STRIPE_WEBHOOK_SECRET"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: getEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),
  STRIPE_PRICE_STARTER: getEnv("STRIPE_PRICE_STARTER"),
  STRIPE_PRICE_GROWTH: getEnv("STRIPE_PRICE_GROWTH"),
  STRIPE_PRICE_DOMINATION: getEnv("STRIPE_PRICE_DOMINATION"),
  /** Optional global Shopify webhook secret (per-store secret can live in business profile) */
  SHOPIFY_WEBHOOK_SECRET: getEnv("SHOPIFY_WEBHOOK_SECRET"),
  /** SMS — Twilio primary */
  TWILIO_ACCOUNT_SID: getEnv("TWILIO_ACCOUNT_SID"),
  TWILIO_AUTH_TOKEN: getEnv("TWILIO_AUTH_TOKEN"),
  TWILIO_FROM_NUMBER: getEnv("TWILIO_FROM_NUMBER"),
  /** Optional: AgentMail HTTP API (set base URL + key from their docs) */
  AGENTMAIL_API_URL: getEnv("AGENTMAIL_API_URL"),
  AGENTMAIL_API_KEY: getEnv("AGENTMAIL_API_KEY"),
  /** AES key for ad account credentials (32+ chars recommended) */
  CREDENTIALS_ENCRYPTION_KEY: getEnv("CREDENTIALS_ENCRYPTION_KEY"),
};

export function assertRequiredEnv(names: string[]) {
  const missing = names.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

const SUPABASE_SETUP_HINT =
  "Create a file named .env.local in the project root (same folder as package.json). Copy .env.example to .env.local, then open Supabase → Project Settings → API and paste NEXT_PUBLIC_SUPABASE_URL and the anon public key as NEXT_PUBLIC_SUPABASE_ANON_KEY. Restart npm run dev after saving.";

/**
 * Validates public Supabase vars before creating any client (server or browser).
 */
export function requireSupabasePublicEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  if (!url || !anonKey) {
    throw new Error(
      `Supabase is not configured: need NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. ${SUPABASE_SETUP_HINT}`,
    );
  }
  return { url, anonKey };
}

/**
 * Service-role operations (API routes, webhooks). Requires URL + service role secret.
 */
export function requireSupabaseServiceEnv(): { url: string; serviceKey: string } {
  const { url } = requireSupabasePublicEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_KEY?.trim() ?? "";
  if (!serviceKey) {
    throw new Error(
      `Missing SUPABASE_SERVICE_KEY (required for server-side admin/API tasks). ${SUPABASE_SETUP_HINT} Also copy the service_role key from the same API settings page.`,
    );
  }
  return { url, serviceKey };
}
