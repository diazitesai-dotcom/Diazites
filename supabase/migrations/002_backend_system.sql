-- Backend extensions: system events, landing pages, usage tracking.
-- Apply after schema.sql on existing projects.

create table if not exists system_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  lead_id uuid references leads(id) on delete set null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_system_events_business_id on system_events(business_id);
create index if not exists idx_system_events_event_type on system_events(event_type);
create index if not exists idx_system_events_created_at on system_events(created_at desc);

alter table system_events enable row level security;

create policy "system_events owner select" on system_events
for select using (
  business_id is null
  or exists (
    select 1 from businesses b
    where b.id = system_events.business_id and b.user_id = auth.uid()
  )
);

create policy "system_events owner insert" on system_events
for insert with check (
  exists (
    select 1 from businesses b
    where b.id = system_events.business_id and b.user_id = auth.uid()
  )
);

create table if not exists landing_pages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  slug text not null,
  headline text,
  offer text,
  location text,
  config jsonb not null default '{}'::jsonb,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(business_id, slug)
);

create index if not exists idx_landing_pages_slug_published on landing_pages(slug)
  where published = true;

alter table landing_pages enable row level security;

create policy "landing_pages business owner full" on landing_pages
for all using (
  exists (
    select 1 from businesses b
    where b.id = landing_pages.business_id and b.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from businesses b
    where b.id = landing_pages.business_id and b.user_id = auth.uid()
  )
);

create policy "landing_pages public read published" on landing_pages
for select using (published = true);

create table if not exists usage_snapshots (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  leads_count int default 0,
  ai_messages_count int default 0,
  campaigns_active int default 0,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(business_id, period_start)
);

alter table usage_snapshots enable row level security;

create policy "usage_snapshots business owner" on usage_snapshots
for all using (
  exists (
    select 1 from businesses b
    where b.id = usage_snapshots.business_id and b.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from businesses b
    where b.id = usage_snapshots.business_id and b.user_id = auth.uid()
  )
);
