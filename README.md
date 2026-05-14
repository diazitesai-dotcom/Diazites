# Diazites AI Marketing Platform

Production-focused SaaS platform for roofing contractors to generate leads, manage campaigns, automate AI follow-up, and track pipeline performance.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (database, auth, storage-ready)
- OpenAI Responses API
- Resend, Twilio, Stripe
- Vercel deployment target (incl. Vercel Cron)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in the required keys (see [Environment variables](#environment-variables)).

3. Apply the database schema in Supabase (see [Database](#database)).

4. Run locally:

```bash
npm run dev
```

## Environment variables

All variables live in `.env.example`. Required for the app to boot:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon public key (browser/server reads) |
| `SUPABASE_SERVICE_KEY` | Service role key (API routes, cron) |
| `NEXT_PUBLIC_APP_URL` | Canonical site origin (also set as Supabase Auth → Site URL) |
| `OPENAI_API_KEY` | OpenAI Responses API |
| `RESEND_API_KEY` | Transactional email |

Optional (gated at runtime — feature stays in stub mode if blank):

- **Cron**: `CRON_SECRET` — shared secret for `/api/cron/optimize`
- **SMS**: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` (or `AGENTMAIL_*`)
- **Billing**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_*`
- **Ads OAuth**: `META_*`, `GOOGLE_ADS_*`, `TIKTOK_*`, `MICROSOFT_ADS_*`
- **Zernio** (multi-platform broker — recommended over per-platform OAuth): `ZERNIO_API_BASE_URL` (optional, defaults to `https://zernio.com/api/v1`), `ZERNIO_API_KEY` (Cursor MCP only — per-tenant keys come from the UI)

If any of these end up in git history (incl. an old version of `.env.example`), rotate them at the provider immediately — that's the only way to truly invalidate the leak.

## Database

Schema lives in `supabase/`:

- `supabase/schema.sql` — full schema baseline (indexes + RLS)
- `supabase/seed.sql` — starter data
- `supabase/migrations/` — incremental migrations to apply on top of the baseline

When deploying to a new Supabase project, apply `schema.sql` first, then every file under `supabase/migrations/` in order. For an existing project, apply only the migrations that haven't been run yet. Patch files in `tmp/` are one-off live-DB hotfixes you can paste directly into the Supabase SQL Editor when called for.

## Core routes

- `/` public homepage
- `/signup`, `/login`, `/forgot-password`, `/reset-password`
- `/onboarding`
- `/dashboard` — overview + every operational page (Growth Engine, Ads, Optimization, Agent Manager, Leads CRM, Campaigns, Automations, Approvals, Reports, Team, Billing, Settings, Funnel Builder)
- `/admin` (admin-only)
- `POST /api/leads` — lead intake + AI follow-up trigger
- `POST /api/track` — public engagement event ingest (page views, CTA clicks, form submits)
- `GET  /api/cron/optimize` — optimization sweep (Vercel Cron entrypoint, auth via `CRON_SECRET`)
- `POST /api/webhooks/stripe` — Stripe webhook receiver

## Cron / scheduled jobs

`vercel.json` declares the production schedule:

```json
{
  "crons": [
    { "path": "/api/cron/optimize", "schedule": "0 * * * *" }
  ]
}
```

Runs hourly at minute 0. Vercel automatically injects `Authorization: Bearer <CRON_SECRET>`; set `CRON_SECRET` in Vercel Project Settings → Environment Variables (Production) and the same value locally if you want to test with curl:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/cron/optimize
```

Note: Vercel Hobby is limited to once-daily crons. If you're on Hobby, change the schedule to e.g. `0 7 * * *` (07:00 UTC daily) until you upgrade to Pro.

The sweep is heuristic (no AI cost) so hourly is safe. Each run records a row in `optimization_runs` and zero-or-more `engine_decisions` per active business.

## Deploy to Vercel

1. Import the repository into Vercel.
2. Add all required env vars in Project Settings (and the optional ones you're using).
3. Set `NEXT_PUBLIC_APP_URL` to your production domain.
4. Verify `vercel.json` cron registered (Project → Settings → Cron Jobs).
5. Deploy.

## Integrations

### Zernio (multi-platform social + ads broker)

[Zernio](https://zernio.com) brokers 14 social/ads platforms (Meta, Instagram, LinkedIn, TikTok, YouTube, Google Business, X, etc.) behind a single API key. The platform connects via `/dashboard/ads` → **Zernio** card:

1. Connect each social/ads account inside zernio.com.
2. Create an API key at `zernio.com/dashboard/api-keys`.
3. Paste the key into the Zernio connector. Diazites verifies it against `GET /accounts` before persisting.

Per-business keys are stored in `ad_accounts.access_token` with `platform = 'zernio'` and isolated by RLS. The Growth Engine&apos;s Launch stage can route the winning ad/post variant through Zernio instead of per-platform stubs.

For Cursor IDE agents, `.cursor/mcp.json` registers the hosted Zernio MCP server at `https://mcp.zernio.com/mcp` using `${ZERNIO_API_KEY}` from your local env.

### Zapier

Generic event-forwarding bridge to 8,000+ apps. Configure on `/dashboard/ads` → **Zapier** card. Subscriptions live in `automation_rules` and fire on lead/engine/campaign events.

## Notes

- Middleware protects `/dashboard`, `/onboarding`, and `/admin`.
- `/admin` additionally checks `admin_users` access in Supabase.
- AI follow-up generation lives in `services/ai/` and the engine pipeline in `services/engine/` (see `orchestrator.service.ts` for the 8-stage flow).
- Service-oriented layout: `repositories/` (pure DB), `services/` (business logic + external APIs), `actions/` and `services/**/actions.ts` (server actions for UI mutations).
