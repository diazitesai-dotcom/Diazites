-- AI usage telemetry: records every OpenAI call made by the Growth Engine
-- (Research, Strategy, Funnel, Generation, Variants, Scoring) with token
-- counts and estimated USD cost. Used to power per-tenant cost guards.
-- Apply after 006_growth_engine.sql.

create table if not exists ai_usage (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  run_id uuid references growth_engine_runs(id) on delete set null,
  model text not null,
  purpose text not null,
  prompt_tokens int not null default 0,
  completion_tokens int not null default 0,
  total_tokens int not null default 0,
  cost_usd numeric(12, 6) not null default 0,
  status text not null default 'success' check (status in ('success', 'error')),
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_usage_business
  on ai_usage(business_id, created_at desc);

create index if not exists idx_ai_usage_run
  on ai_usage(run_id) where run_id is not null;

create index if not exists idx_ai_usage_business_month
  on ai_usage(business_id, date_trunc('month', created_at));

alter table ai_usage enable row level security;

drop policy if exists "ai_usage business owner select" on ai_usage;
create policy "ai_usage business owner select" on ai_usage
for select using (
  business_id is null or exists (
    select 1 from businesses b
    where b.id = ai_usage.business_id and b.user_id = auth.uid()
  )
);

drop policy if exists "ai_usage business owner insert" on ai_usage;
create policy "ai_usage business owner insert" on ai_usage
for insert with check (
  business_id is null or exists (
    select 1 from businesses b
    where b.id = ai_usage.business_id and b.user_id = auth.uid()
  )
);
