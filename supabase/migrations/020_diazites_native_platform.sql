-- Native Diazites CRM, workflows, AI calling, and project management (no GHL).

-- ---------------------------------------------------------------------------
-- Pipelines & CRM extensions
-- ---------------------------------------------------------------------------

create table if not exists public.pipelines (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  description text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pipelines_business on public.pipelines(business_id);

create table if not exists public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  pipeline_id uuid not null references public.pipelines(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  stage_type text not null default 'open'
    check (stage_type in ('open', 'won', 'lost')),
  color text,
  created_at timestamptz not null default now()
);

create index if not exists idx_pipeline_stages_pipeline on public.pipeline_stages(pipeline_id, sort_order);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  lead_id uuid references leads(id) on delete set null,
  name text not null,
  email text,
  phone text,
  company text,
  source text,
  custom_fields jsonb not null default '{}'::jsonb,
  pipeline_id uuid references public.pipelines(id) on delete set null,
  pipeline_stage_id uuid references public.pipeline_stages(id) on delete set null,
  lead_score int not null default 0,
  temperature text check (temperature in ('hot', 'warm', 'cold')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contacts_business on public.contacts(business_id);
create index if not exists idx_contacts_lead on public.contacts(lead_id);

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  pipeline_id uuid references public.pipelines(id) on delete set null,
  pipeline_stage_id uuid references public.pipeline_stages(id) on delete set null,
  title text not null,
  value numeric(12,2) default 0,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  color text default '#8b5cf6',
  created_at timestamptz not null default now(),
  unique(business_id, name)
);

create table if not exists public.contact_tags (
  contact_id uuid not null references public.contacts(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (contact_id, tag_id)
);

create table if not exists public.lead_scores (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  lead_id uuid references leads(id) on delete cascade,
  score int not null default 0,
  factors jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Native workflows
-- ---------------------------------------------------------------------------

create table if not exists public.diazites_workflows (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'paused', 'archived')),
  definition jsonb not null default '{"nodes":[],"edges":[]}'::jsonb,
  pipeline_id uuid references public.pipelines(id) on delete set null,
  pipeline_stage_id uuid references public.pipeline_stages(id) on delete set null,
  trigger_type text,
  attachment jsonb not null default '{}'::jsonb,
  conversion_rate numeric(6,4) default 0,
  revenue_attributed numeric(12,2) default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_diazites_workflows_business on public.diazites_workflows(business_id, status);

create table if not exists public.workflow_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  category text not null default 'general',
  definition jsonb not null default '{"nodes":[],"edges":[]}'::jsonb,
  is_system boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  workflow_id uuid not null references public.diazites_workflows(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  lead_id uuid references leads(id) on delete set null,
  status text not null default 'running'
    check (status in ('running', 'completed', 'failed', 'paused', 'cancelled')),
  current_node_id text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  error_message text
);

create index if not exists idx_workflow_runs_workflow on public.workflow_runs(workflow_id, started_at desc);

create table if not exists public.workflow_run_steps (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.workflow_runs(id) on delete cascade,
  node_id text not null,
  action_type text not null,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'completed', 'failed', 'skipped')),
  payload jsonb not null default '{}'::jsonb,
  executed_at timestamptz,
  error_message text
);

create table if not exists public.workflow_enrollments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  workflow_id uuid not null references public.diazites_workflows(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  lead_id uuid references leads(id) on delete set null,
  status text not null default 'active'
    check (status in ('active', 'completed', 'removed', 'failed')),
  enrolled_at timestamptz not null default now(),
  unique(workflow_id, contact_id, lead_id)
);

-- ---------------------------------------------------------------------------
-- Conversations & messaging
-- ---------------------------------------------------------------------------

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  lead_id uuid references leads(id) on delete set null,
  channel text not null default 'sms' check (channel in ('sms', 'email', 'chat', 'call')),
  subject text,
  last_message_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound')),
  body text not null,
  metadata jsonb not null default '{}'::jsonb,
  sent_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- AI calling
-- ---------------------------------------------------------------------------

create table if not exists public.ai_calling_agents (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  objective text not null,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'paused', 'archived')),
  voice_config jsonb not null default '{}'::jsonb,
  script_config jsonb not null default '{}'::jsonb,
  routing_config jsonb not null default '{}'::jsonb,
  pipeline_id uuid references public.pipelines(id) on delete set null,
  workflow_id uuid references public.diazites_workflows(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.diazites_calls (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  ai_agent_id uuid references public.ai_calling_agents(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  lead_id uuid references leads(id) on delete set null,
  direction text not null check (direction in ('inbound', 'outbound')),
  status text not null default 'queued'
    check (status in ('queued', 'ringing', 'active', 'completed', 'failed', 'voicemail', 'missed')),
  outcome text,
  duration_seconds int default 0,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.call_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  call_id uuid not null references public.diazites_calls(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.call_transcripts (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.diazites_calls(id) on delete cascade,
  speaker text not null default 'agent',
  content text not null,
  sentiment text,
  sequence int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.call_recordings (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.diazites_calls(id) on delete cascade,
  storage_url text,
  duration_seconds int default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Appointments (native scheduling)
-- ---------------------------------------------------------------------------

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  lead_id uuid references leads(id) on delete set null,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'missed', 'cancelled')),
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Project management
-- ---------------------------------------------------------------------------

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.project_boards (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  name text not null,
  board_type text not null default 'kanban' check (board_type in ('kanban', 'list')),
  created_at timestamptz not null default now()
);

create table if not exists public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  board_id uuid references public.project_boards(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  lead_id uuid references leads(id) on delete set null,
  workflow_run_id uuid references public.workflow_runs(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'done', 'blocked')),
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'urgent')),
  due_at timestamptz,
  assigned_to uuid references auth.users(id) on delete set null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Agent tools & activity
-- ---------------------------------------------------------------------------

create table if not exists public.agent_tools (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  agent_key text not null,
  tool_key text not null,
  enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  unique(business_id, agent_key, tool_key)
);

create table if not exists public.agent_activity_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  agent_key text not null,
  action_type text not null,
  entity_type text,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_agent_activity_business on public.agent_activity_logs(business_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.pipelines enable row level security;
alter table public.pipeline_stages enable row level security;
alter table public.contacts enable row level security;
alter table public.opportunities enable row level security;
alter table public.tags enable row level security;
alter table public.contact_tags enable row level security;
alter table public.lead_scores enable row level security;
alter table public.diazites_workflows enable row level security;
alter table public.workflow_templates enable row level security;
alter table public.workflow_runs enable row level security;
alter table public.workflow_run_steps enable row level security;
alter table public.workflow_enrollments enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.ai_calling_agents enable row level security;
alter table public.diazites_calls enable row level security;
alter table public.call_logs enable row level security;
alter table public.call_transcripts enable row level security;
alter table public.call_recordings enable row level security;
alter table public.appointments enable row level security;
alter table public.projects enable row level security;
alter table public.project_boards enable row level security;
alter table public.project_tasks enable row level security;
alter table public.agent_tools enable row level security;
alter table public.agent_activity_logs enable row level security;

create or replace function public.user_owns_business(p_business_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from businesses b where b.id = p_business_id and b.user_id = auth.uid());
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'pipelines','pipeline_stages','contacts','opportunities','tags','lead_scores',
    'diazites_workflows','workflow_runs','workflow_enrollments',
    'conversations','messages','ai_calling_agents','diazites_calls','call_logs',
    'appointments','projects','project_boards',
    'project_tasks','agent_tools','agent_activity_logs'
  ]
  loop
    execute format('drop policy if exists "%s owner" on public.%s', t, t);
    execute format(
      'create policy "%s owner" on public.%s for all using (user_owns_business(business_id)) with check (user_owns_business(business_id))',
      t, t
    );
  end loop;
end $$;

drop policy if exists "workflow_run_steps owner" on public.workflow_run_steps;
create policy "workflow_run_steps owner" on public.workflow_run_steps for all using (
  exists (
    select 1 from workflow_runs r
    where r.id = run_id and user_owns_business(r.business_id)
  )
) with check (
  exists (
    select 1 from workflow_runs r
    where r.id = run_id and user_owns_business(r.business_id)
  )
);

drop policy if exists "call_transcripts owner" on public.call_transcripts;
create policy "call_transcripts owner" on public.call_transcripts for all using (
  exists (
    select 1 from diazites_calls c
    where c.id = call_id and user_owns_business(c.business_id)
  )
) with check (
  exists (
    select 1 from diazites_calls c
    where c.id = call_id and user_owns_business(c.business_id)
  )
);

drop policy if exists "call_recordings owner" on public.call_recordings;
create policy "call_recordings owner" on public.call_recordings for all using (
  exists (
    select 1 from diazites_calls c
    where c.id = call_id and user_owns_business(c.business_id)
  )
) with check (
  exists (
    select 1 from diazites_calls c
    where c.id = call_id and user_owns_business(c.business_id)
  )
);

drop policy if exists "workflow_templates read" on public.workflow_templates;
create policy "workflow_templates read" on public.workflow_templates for select using (true);

drop policy if exists "contact_tags owner" on public.contact_tags;
create policy "contact_tags owner" on public.contact_tags for all using (
  exists (select 1 from contacts c where c.id = contact_id and user_owns_business(c.business_id))
);
