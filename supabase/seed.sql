insert into users (id, email)
values ('11111111-1111-1111-1111-111111111111', 'owner@diazites.com')
on conflict (id) do nothing;

insert into businesses (id, owner_user_id, name, website, service_area, city_state, monthly_budget)
values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'EverPeak Roofing',
  'https://everpeakroofing.com',
  'Greater Tampa Bay',
  'Tampa, FL',
  5000
)
on conflict (id) do nothing;

insert into billing (business_id, plan_name, amount, payment_status)
values ('22222222-2222-2222-2222-222222222222', 'Growth', 997, 'active')
on conflict (business_id) do nothing;
