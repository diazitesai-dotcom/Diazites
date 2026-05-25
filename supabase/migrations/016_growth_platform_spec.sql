-- Growth platform MVP: extended business profile, tasks, agent action logs

alter table public.businesses
  add column if not exists profile jsonb not null default '{}'::jsonb;

alter table public.onboarding
  add column if not exists profile_data jsonb not null default '{}'::jsonb;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'completed', 'overdue')),
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high')),
  assigned_to text,
  source_agent text,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tasks_business_id on public.tasks(business_id);
create index if not exists idx_tasks_status on public.tasks(business_id, status);

create table if not exists public.agent_actions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  agent_type text not null,
  action_type text not null,
  summary text not null,
  detail jsonb not null default '{}'::jsonb,
  approval_state text,
  user_overridden boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_agent_actions_business on public.agent_actions(business_id, created_at desc);

alter table public.tasks enable row level security;
alter table public.agent_actions enable row level security;

create policy "tasks business owner access" on public.tasks
for all using (
  exists (
    select 1 from public.businesses b
    where b.id = tasks.business_id and b.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.businesses b
    where b.id = tasks.business_id and b.user_id = auth.uid()
  )
);

create policy "agent_actions business owner access" on public.agent_actions
for all using (
  exists (
    select 1 from public.businesses b
    where b.id = agent_actions.business_id and b.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.businesses b
    where b.id = agent_actions.business_id and b.user_id = auth.uid()
  )
);
