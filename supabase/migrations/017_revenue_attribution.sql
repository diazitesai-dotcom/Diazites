-- Revenue attribution: manual entries + business attribution settings in profile

create table if not exists public.revenue_entries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  lead_name text,
  source_key text not null default 'manual_sales',
  campaign text,
  amount numeric(12,2) not null check (amount >= 0),
  close_method text not null default 'manual_entry',
  closed_at timestamptz not null default now(),
  attribution_type text not null default 'manual_override',
  notes text,
  agent_key text,
  created_at timestamptz not null default now()
);

create index if not exists idx_revenue_entries_business on public.revenue_entries(business_id, closed_at desc);

alter table public.revenue_entries enable row level security;

create policy "revenue_entries business owner" on public.revenue_entries
for all using (
  exists (
    select 1 from public.businesses b
    where b.id = revenue_entries.business_id and b.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.businesses b
    where b.id = revenue_entries.business_id and b.user_id = auth.uid()
  )
);
