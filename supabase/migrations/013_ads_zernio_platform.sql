-- Phase 5b: extend ad_accounts.platform to include 'zernio' so we can store
-- a per-business Zernio API key alongside the existing Meta/Google/TikTok/
-- Microsoft connectors. Zernio is a broker: a single connection unlocks 14
-- downstream platforms, but the connection state itself lives in the same
-- ad_accounts shape (status + access_token).
--
-- Idempotent. Apply after 009_ads_engine.sql.

do $$
declare
  cname text;
begin
  select conname into cname
  from pg_constraint
  where conrelid = 'public.ad_accounts'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%platform%';

  if cname is not null then
    execute format('alter table ad_accounts drop constraint %I', cname);
  end if;
end $$;

alter table ad_accounts
  add constraint ad_accounts_platform_check
  check (platform in ('meta', 'google', 'tiktok', 'microsoft', 'zernio'));
