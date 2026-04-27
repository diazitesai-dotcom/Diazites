# Diazites AI Marketing Platform

Production-focused SaaS platform for roofing contractors to generate leads, manage campaigns, automate AI follow-up, and track pipeline performance.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (database, auth, storage-ready)
- OpenAI Responses API
- Resend
- Vercel deployment target

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy and configure environment variables:
```bash
cp .env.example .env.local
```

3. Fill in:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `RESEND_API_KEY`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_APP_URL`

4. Run locally:
```bash
npm run dev
```

## Database

SQL files are in `supabase/`:
- `supabase/schema.sql` (full schema + indexes + RLS)
- `supabase/seed.sql` (starter data)

Apply in Supabase SQL editor or CLI workflow.

## Core Routes

- `/` public homepage
- `/signup`, `/login`, `/forgot-password`, `/reset-password`
- `/onboarding`
- `/dashboard`
- `/admin`
- `POST /api/leads` lead intake + AI follow-up trigger

## Deploy To Vercel

1. Import repository into Vercel.
2. Add all environment variables in Vercel Project Settings.
3. Set production domain to [diazites.com](https://diazites.com).
4. Deploy.

## Notes

- Middleware protects `/dashboard`, `/onboarding`, and `/admin`.
- `/admin` additionally checks `admin_users` access in Supabase.
- AI follow-up generation is abstracted in `services/ai/response-service.ts` for future multi-provider support.
