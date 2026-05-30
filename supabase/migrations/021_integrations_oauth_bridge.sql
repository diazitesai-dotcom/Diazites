-- Bridge Ads Engine OAuth columns with Integrations hub (Marketing OS fields).
-- Safe to run on DBs that started from 006, 009, or both.

alter table ad_accounts add column if not exists status text default 'disconnected';
alter table ad_accounts add column if not exists access_token text;
alter table ad_accounts add column if not exists refresh_token text;
alter table ad_accounts add column if not exists token_expires_at timestamptz;
alter table ad_accounts add column if not exists scopes text[] default '{}';
alter table ad_accounts add column if not exists meta jsonb not null default '{}'::jsonb;
alter table ad_accounts add column if not exists account_name text;
alter table ad_accounts add column if not exists credentials_hint text;

-- Backfill hub status from engine OAuth rows when connection_status column exists
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'ad_accounts'
      and column_name = 'connection_status'
  ) then
    update ad_accounts
    set
      connection_status = 'connected'::connection_status,
      external_account_id = coalesce(nullif(trim(external_account_id), ''), 'google_ads'),
      account_name = coalesce(account_name, 'Google Ads')
    where platform::text = 'google'
      and status in ('connected', 'pending')
      and connection_status is distinct from 'connected'::connection_status;

    update ad_accounts
    set
      connection_status = 'connected'::connection_status,
      external_account_id = coalesce(nullif(trim(external_account_id), ''), 'meta'),
      account_name = coalesce(account_name, 'Meta Ads')
    where platform::text = 'meta'
      and status in ('connected', 'pending')
      and connection_status is distinct from 'connected'::connection_status;
  end if;
end $$;
