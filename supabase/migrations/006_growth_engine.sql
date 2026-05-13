-- Growth Engine: 8-step AI marketing pipeline (Input → Research → Strategy →
-- Funnel → Generation → Variants → Scoring → Launch) and generated assets.
-- Apply after schema.sql and 005_stripe_automation.sql.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'engine_step') then
    create type engine_step as enum (
      'input',
      'research',
      'strategy',
      'funnel',
      'generation',
      'variants',
      'scoring',
      'launch'
    );
  end if;
end $$;

create table if not exists growth_engine_runs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  current_step engine_step not null default 'input',
  status text not null default 'running'
    check (status in ('running', 'needs_approval', 'launched', 'failed', 'archived')),
  input_payload jsonb not null default '{}'::jsonb,
  research_payload jsonb,
  strategy_payload jsonb,
  funnel_payload jsonb,
  generation_payload jsonb,
  variants_payload jsonb,
  scoring_payload jsonb,
  launch_payload jsonb,
  winner_asset_id uuid,
  launched_at timestamptz,
  failed_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_growth_engine_runs_business
  on growth_engine_runs(business_id, created_at desc);

create index if not exists idx_growth_engine_runs_business_active
  on growth_engine_runs(business_id)
  where status in ('running', 'needs_approval');

create table if not exists assets (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references growth_engine_runs(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  kind text not null
    check (kind in (
      'landing_page', 'ad', 'email', 'sms',
      'headline', 'faq', 'lead_magnet', 'social_proof'
    )),
  variant_label text not null,
  payload jsonb not null default '{}'::jsonb,
  score jsonb,
  is_winner boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_assets_run on assets(run_id);
create index if not exists idx_assets_business on assets(business_id);
create index if not exists idx_assets_run_kind on assets(run_id, kind);
create index if not exists idx_assets_winner on assets(run_id) where is_winner = true;

-- Late FK so growth_engine_runs.winner_asset_id can reference assets without
-- a circular create-order problem.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'growth_engine_runs_winner_asset_fk'
  ) then
    alter table growth_engine_runs
      add constraint growth_engine_runs_winner_asset_fk
      foreign key (winner_asset_id) references assets(id) on delete set null;
  end if;
end $$;

-- Auto-update updated_at on row change.
create or replace function public.touch_growth_engine_runs_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_growth_engine_runs_updated_at on growth_engine_runs;
create trigger trg_touch_growth_engine_runs_updated_at
  before update on growth_engine_runs
  for each row execute procedure public.touch_growth_engine_runs_updated_at();

alter table growth_engine_runs enable row level security;
alter table assets enable row level security;

drop policy if exists "growth_engine_runs business owner full" on growth_engine_runs;
create policy "growth_engine_runs business owner full" on growth_engine_runs
for all using (
  exists (
    select 1 from businesses b
    where b.id = growth_engine_runs.business_id and b.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from businesses b
    where b.id = growth_engine_runs.business_id and b.user_id = auth.uid()
  )
);

drop policy if exists "assets business owner full" on assets;
create policy "assets business owner full" on assets
for all using (
  exists (
    select 1 from businesses b
    where b.id = assets.business_id and b.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from businesses b
    where b.id = assets.business_id and b.user_id = auth.uid()
  )
);
