-- New signups default to starter plan (was free).

create or replace function public.provision_user_access(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
  v_plan_key text;
  v_role text;
begin
  if p_user_id is null then
    return;
  end if;

  v_is_admin := exists (
    select 1 from public.admin_users a where a.user_id = p_user_id
  );

  v_plan_key := case when v_is_admin then 'enterprise' else 'starter' end;
  v_role := case when v_is_admin then 'owner_admin' else 'user' end;

  insert into public.user_platform_accounts (user_id, plan_key, account_role, status)
  values (p_user_id, v_plan_key, v_role, 'active')
  on conflict (user_id) do update set
    plan_key = case
      when excluded.account_role = 'owner_admin' then excluded.plan_key
      else public.user_platform_accounts.plan_key
    end,
    account_role = case
      when v_is_admin then 'owner_admin'
      else public.user_platform_accounts.account_role
    end,
    updated_at = now();

  perform public.apply_plan_defaults_to_user(p_user_id, v_plan_key, null);
end;
$$;

-- Map legacy free users to starter entitlements
update public.user_platform_accounts
set plan_key = 'starter'
where plan_key = 'free';
