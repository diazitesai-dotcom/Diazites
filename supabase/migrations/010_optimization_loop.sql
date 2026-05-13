-- Phase 7: Optimization Loop.
-- engine_events records every visit / lead / spend signal we receive from
-- public pages and ad platforms.
-- engine_decisions records each AI-generated optimization decision (e.g.
-- pause variant, scale budget, swap headline) along with its application status.
-- optimization_runs records each cron sweep.
-- Apply after 009_ads_engine.sql.

create table if not exists engine_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  ad_campaign_id uuid references ad_campaigns(id) on delete set null,
  landing_page_id uuid references landing_pages(id) on delete set null,
  asset_id uuid references assets(id) on delete set null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_engine_events_business_time
  on engine_events(business_id, occurred_at desc);
create index if not exists idx_engine_events_type
  on engine_events(business_id, event_type, occurred_at desc);
create index if not exists idx_engine_events_landing
  on engine_events(landing_page_id) where landing_page_id is not null;

create table if not exists engine_decisions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  optimization_run_id uuid,
  rationale text not null,
  action_kind text not null
    check (action_kind in (
      'pause_variant', 'scale_budget', 'reduce_budget',
      'swap_headline', 'rerun_engine', 'no_op'
    )),
  action_payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'applied', 'rejected', 'errored')),
  applied_at timestamptz,
  decided_by uuid references users(id),
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists idx_engine_decisions_business
  on engine_decisions(business_id, created_at desc);

create table if not exists optimization_runs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  window_started_at timestamptz not null,
  window_ended_at timestamptz not null,
  events_considered int not null default 0,
  decisions_generated int not null default 0,
  status text not null default 'success'
    check (status in ('success', 'error', 'skipped')),
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists idx_optimization_runs_business
  on optimization_runs(business_id, created_at desc);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'engine_decisions_optimization_run_fk'
  ) then
    alter table engine_decisions
      add constraint engine_decisions_optimization_run_fk
      foreign key (optimization_run_id) references optimization_runs(id) on delete set null;
  end if;
end $$;

alter table engine_events enable row level security;
alter table engine_decisions enable row level security;
alter table optimization_runs enable row level security;

drop policy if exists "engine_events owner select" on engine_events;
create policy "engine_events owner select" on engine_events
for select using (
  exists (select 1 from businesses b where b.id = engine_events.business_id and b.user_id = auth.uid())
);

drop policy if exists "engine_events owner insert" on engine_events;
create policy "engine_events owner insert" on engine_events
for insert with check (
  exists (select 1 from businesses b where b.id = engine_events.business_id and b.user_id = auth.uid())
);

drop policy if exists "engine_decisions owner full" on engine_decisions;
create policy "engine_decisions owner full" on engine_decisions
for all using (
  exists (select 1 from businesses b where b.id = engine_decisions.business_id and b.user_id = auth.uid())
) with check (
  exists (select 1 from businesses b where b.id = engine_decisions.business_id and b.user_id = auth.uid())
);

drop policy if exists "optimization_runs owner select" on optimization_runs;
create policy "optimization_runs owner select" on optimization_runs
for select using (
  exists (select 1 from businesses b where b.id = optimization_runs.business_id and b.user_id = auth.uid())
);
