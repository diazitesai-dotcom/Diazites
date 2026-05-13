-- Phase 8: Cross-cutting systems.
-- approvals — generic approval queue for engine decisions, launches, etc.
-- audit_logs — append-only history of every meaningful mutation.
-- notifications — per-user inbox (new lead, approval requested, alert).
-- team_members — multi-seat membership tied to a business with a role.
-- Apply after 010_optimization_loop.sql.

create table if not exists approvals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  subject_kind text not null
    check (subject_kind in ('engine_decision', 'engine_launch', 'ad_campaign', 'asset')),
  subject_id uuid not null,
  state text not null default 'pending'
    check (state in ('pending', 'approved', 'rejected')),
  requested_by uuid references users(id),
  decided_by uuid references users(id),
  decided_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_approvals_business_state
  on approvals(business_id, state, created_at desc);
create index if not exists idx_approvals_subject
  on approvals(subject_kind, subject_id);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete set null,
  actor_user_id uuid references users(id) on delete set null,
  action text not null,
  target_kind text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_business_time
  on audit_logs(business_id, created_at desc);
create index if not exists idx_audit_logs_action
  on audit_logs(action, created_at desc);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  business_id uuid references businesses(id) on delete cascade,
  kind text not null
    check (kind in (
      'new_lead', 'approval_requested', 'engine_launched',
      'engine_failed', 'budget_alert', 'system'
    )),
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_unread
  on notifications(user_id, created_at desc) where read_at is null;
create index if not exists idx_notifications_user_recent
  on notifications(user_id, created_at desc);

create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  email text not null,
  role text not null default 'member'
    check (role in ('owner', 'admin', 'member', 'viewer')),
  invited_by uuid references users(id),
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (business_id, email)
);

create index if not exists idx_team_members_business on team_members(business_id);
create index if not exists idx_team_members_user on team_members(user_id) where user_id is not null;

alter table approvals enable row level security;
alter table audit_logs enable row level security;
alter table notifications enable row level security;
alter table team_members enable row level security;

drop policy if exists "approvals owner full" on approvals;
create policy "approvals owner full" on approvals
for all using (
  exists (select 1 from businesses b where b.id = approvals.business_id and b.user_id = auth.uid())
) with check (
  exists (select 1 from businesses b where b.id = approvals.business_id and b.user_id = auth.uid())
);

drop policy if exists "audit_logs owner select" on audit_logs;
create policy "audit_logs owner select" on audit_logs
for select using (
  business_id is null
  or exists (select 1 from businesses b where b.id = audit_logs.business_id and b.user_id = auth.uid())
);

drop policy if exists "audit_logs owner insert" on audit_logs;
create policy "audit_logs owner insert" on audit_logs
for insert with check (
  business_id is null
  or exists (select 1 from businesses b where b.id = audit_logs.business_id and b.user_id = auth.uid())
);

drop policy if exists "notifications self select" on notifications;
create policy "notifications self select" on notifications
for select using (user_id = auth.uid());

drop policy if exists "notifications self update" on notifications;
create policy "notifications self update" on notifications
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "notifications business owner insert" on notifications;
create policy "notifications business owner insert" on notifications
for insert with check (
  user_id = auth.uid()
  or (
    business_id is not null
    and exists (
      select 1 from businesses b
      where b.id = notifications.business_id and b.user_id = auth.uid()
    )
  )
);

drop policy if exists "team_members business owner" on team_members;
create policy "team_members business owner" on team_members
for all using (
  exists (select 1 from businesses b where b.id = team_members.business_id and b.user_id = auth.uid())
) with check (
  exists (select 1 from businesses b where b.id = team_members.business_id and b.user_id = auth.uid())
);
