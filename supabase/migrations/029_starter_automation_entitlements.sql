-- Starter stack for new free-tier users: automation + comms services, Meta/Google integrations only in UI.
-- Enables email campaigns, AI call center, and workflows on the free plan.

update public.plan_service_entitlements
set enabled_by_default = true
where plan_key = 'free'
  and service_key in ('email_campaigns', 'ai_call', 'workflow_reporting');

-- Backfill existing free-tier users who were provisioned before this change.
insert into public.user_service_access (user_id, service_key, enabled, enabled_at, disabled_at)
select
  upa.user_id,
  pse.service_key,
  true,
  now(),
  null
from public.user_platform_accounts upa
join public.plan_service_entitlements pse
  on pse.plan_key = upa.plan_key
where upa.plan_key = 'free'
  and pse.service_key in ('email_campaigns', 'ai_call', 'workflow_reporting')
  and pse.enabled_by_default = true
on conflict (user_id, service_key) do update set
  enabled = true,
  enabled_at = coalesce(public.user_service_access.enabled_at, now()),
  disabled_at = null,
  updated_at = now();
