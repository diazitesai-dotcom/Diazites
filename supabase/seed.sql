do $$
declare
  v_user_id uuid;
  v_business_id uuid;
begin
  -- Seed depends on an existing Supabase Auth user.
  -- Create owner@diazites.com in Auth first, then run this seed.
  select id into v_user_id
  from auth.users
  where email = 'owner@diazites.com'
  limit 1;

  if v_user_id is null then
    raise exception 'Seed requires auth user owner@diazites.com. Create that user first.';
  end if;

  insert into public.users (id, email)
  values (v_user_id, 'owner@diazites.com')
  on conflict (id) do update set email = excluded.email;

  insert into businesses (user_id, name, website, service_area, city_state, monthly_budget)
  values (
    v_user_id,
    'Diazites Demo Co',
    'https://example.com',
    'Greater Metro Area',
    'Austin, TX',
    5000
  )
  on conflict do nothing;

  select id into v_business_id
  from businesses
  where user_id = v_user_id
  order by created_at asc
  limit 1;

  if v_business_id is not null then
    insert into billing (business_id, plan_name, amount, payment_status)
    values (v_business_id, 'Growth', 997, 'active')
    on conflict (business_id) do update
      set plan_name = excluded.plan_name,
          amount = excluded.amount,
          payment_status = excluded.payment_status;
  end if;
end $$;
