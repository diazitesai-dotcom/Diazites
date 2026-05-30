-- Ads Engine schema (009) is canonical for OAuth: status, access_token, refresh_token, etc.
-- This migration only adds optional display columns — no connection_status (Marketing OS enum).

alter table ad_accounts add column if not exists account_name text;

-- Backfill label for existing Google OAuth rows (engine uses platform + status only)
update ad_accounts
set
  external_account_id = coalesce(nullif(trim(external_account_id), ''), 'google_ads'),
  account_name = coalesce(account_name, 'Google Ads'),
  meta = coalesce(meta, '{}'::jsonb) || '{"accountLabel":"Google Ads"}'::jsonb
where platform::text = 'google'
  and status in ('connected', 'pending');

update ad_accounts
set
  external_account_id = coalesce(nullif(trim(external_account_id), ''), 'meta'),
  account_name = coalesce(account_name, 'Meta Ads'),
  meta = coalesce(meta, '{}'::jsonb) || '{"accountLabel":"Meta Ads"}'::jsonb
where platform::text = 'meta'
  and status in ('connected', 'pending');
