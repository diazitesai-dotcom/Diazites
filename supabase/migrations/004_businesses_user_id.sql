-- Rename businesses.owner_user_id -> user_id (matches user-spec ownership model).
-- Idempotent: skips if businesses.user_id already exists (fresh installs using updated schema.sql).

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'businesses'
      and column_name = 'owner_user_id'
  ) then
    drop policy if exists "businesses owner full access" on businesses;
    drop policy if exists "agents business owner access" on agents;
    drop policy if exists "campaigns business owner access" on campaigns;
    drop policy if exists "leads business owner access" on leads;
    drop policy if exists "messages business owner access" on ai_messages;
    drop policy if exists "reports business owner access" on reports;
    drop policy if exists "billing business owner access" on billing;

    alter table businesses rename column owner_user_id to user_id;

    alter index if exists idx_businesses_owner_user_id rename to idx_businesses_user_id;

    execute $p$
      create policy "businesses owner full access" on businesses
      for all using (user_id = auth.uid()) with check (user_id = auth.uid());
    $p$;

    execute $p$
      create policy "agents business owner access" on agents
      for all using (
        exists (
          select 1 from businesses b
          where b.id = agents.business_id and b.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1 from businesses b
          where b.id = agents.business_id and b.user_id = auth.uid()
        )
      );
    $p$;

    execute $p$
      create policy "campaigns business owner access" on campaigns
      for all using (
        exists (
          select 1 from businesses b
          where b.id = campaigns.business_id and b.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1 from businesses b
          where b.id = campaigns.business_id and b.user_id = auth.uid()
        )
      );
    $p$;

    execute $p$
      create policy "leads business owner access" on leads
      for all using (
        exists (
          select 1 from businesses b
          where b.id = leads.business_id and b.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1 from businesses b
          where b.id = leads.business_id and b.user_id = auth.uid()
        )
      );
    $p$;

    execute $p$
      create policy "messages business owner access" on ai_messages
      for all using (
        exists (
          select 1 from businesses b
          where b.id = ai_messages.business_id and b.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1 from businesses b
          where b.id = ai_messages.business_id and b.user_id = auth.uid()
        )
      );
    $p$;

    execute $p$
      create policy "reports business owner access" on reports
      for all using (
        exists (
          select 1 from businesses b
          where b.id = reports.business_id and b.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1 from businesses b
          where b.id = reports.business_id and b.user_id = auth.uid()
        )
      );
    $p$;

    execute $p$
      create policy "billing business owner access" on billing
      for all using (
        exists (
          select 1 from businesses b
          where b.id = billing.business_id and b.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1 from businesses b
          where b.id = billing.business_id and b.user_id = auth.uid()
        )
      );
    $p$;
  end if;
end $$;

-- Refresh extension-table policies when present (002) — uses user_id in both old & new DBs
do $$
begin
  if to_regclass('public.system_events') is not null then
    execute 'drop policy if exists "system_events owner select" on public.system_events';
    execute 'drop policy if exists "system_events owner insert" on public.system_events';
    execute $p$
      create policy "system_events owner select" on public.system_events
      for select using (
        business_id is null
        or exists (
          select 1 from businesses b
          where b.id = system_events.business_id and b.user_id = auth.uid()
        )
      );
    $p$;
    execute $p$
      create policy "system_events owner insert" on public.system_events
      for insert with check (
        exists (
          select 1 from businesses b
          where b.id = system_events.business_id and b.user_id = auth.uid()
        )
      );
    $p$;
  end if;

  if to_regclass('public.landing_pages') is not null then
    execute 'drop policy if exists "landing_pages business owner full" on public.landing_pages';
    execute $p$
      create policy "landing_pages business owner full" on public.landing_pages
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
    $p$;
  end if;

  if to_regclass('public.usage_snapshots') is not null then
    execute 'drop policy if exists "usage_snapshots business owner" on public.usage_snapshots';
    execute $p$
      create policy "usage_snapshots business owner" on public.usage_snapshots
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
    $p$;
  end if;
end $$;
