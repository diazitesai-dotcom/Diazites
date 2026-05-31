# Diazites access control

## Roles

| Role | Source | Access |
|------|--------|--------|
| `owner_admin` | `admin_users` table (+ `user_platform_accounts.account_role`) | All services, admin User Control |
| `user` | Default for new signups | Plan + per-service rows only |

**Never** store admin authorization in `user_metadata` (user-editable). Use `admin_users` and RLS.

## Default new user

On `auth.users` insert, `handle_new_auth_user` calls `provision_user_access`:

- Plan: `free`
- Role: `user`
- Enabled: `basic_services`, `mission_control`
- Disabled: `email_campaigns`, `ai_call`, `agents`, `ads_management`, `workflow_reporting`

## Apply migration

```bash
supabase db push
# or run supabase/migrations/026_access_control_entitlements.sql in the SQL editor
```

Grant yourself admin (if needed):

```sql
insert into admin_users (user_id, role)
values ('<your-auth-user-uuid>', 'owner_admin')
on conflict (user_id) do update set role = 'owner_admin';
```

## Admin UI

- **List:** `/admin/user-control`
- **Detail:** `/admin/user-control/[userId]`

## Backend API (TypeScript)

- `getCurrentUserAccess()` — `lib/access-control/access-control.service.ts`
- `requireServiceAccess(userId, serviceKey)`
- `requireDashboardService(serviceKey)` — page guard (`lib/access-control/guard.ts`)
- Admin: `listUsersForAdmin`, `getUserAdminDetails`, `updateUserPlan`, `enableUserService`, `disableUserService`, `getAuditLogsForUser`

Admin mutations use RPC: `admin_set_user_service`, `admin_update_user_plan` (owner_admin only).

## Verification

### Automated (nav + defaults, no DB)

```bash
npx tsx lib/access-control/verify-access-control.ts
```

### Manual

1. **New user** — Sign up as a new email. Sidebar should show onboarding, business profile, Mission Control, and basic ops—not Email campaigns, AI calls, Agents, or Campaign manager.
2. **Admin** — Open `/admin/user-control`, open the user, enable `email_campaigns`. User refreshes dashboard; Email campaigns appears; `/dashboard/email-campaigns` loads.
3. **Self-grant blocked** — As a normal user, direct `update` on `user_service_access` should fail (RLS).
4. **Disabled route** — Disable `ai_call` for user; visiting `/dashboard/ai-calls` redirects to `/dashboard?error=service_disabled`.
5. **Audit** — After toggling a service, user detail shows `service_enabled` / `service_disabled` in audit history.
