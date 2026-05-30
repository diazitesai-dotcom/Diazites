import { PageHeader } from "@/components/layout/page-header";
import { AdminAuthSetupClient } from "@/components/admin/admin-auth-setup-client";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { isOAuthProviderConfigured } from "@/lib/auth/oauth-providers";
import { getPublicAppUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function AdminSetupPage() {
  await requireAdmin();

  const appUrl = getPublicAppUrl();
  const supabaseAuthProvidersUrl = supabaseDashboardAuthProvidersUrl(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <PageHeader
        eyebrow="Developer"
        title="Auth & OAuth setup"
        description="Configure Google and Facebook sign-in in Supabase and control which social buttons appear in the app."
      />
      <AdminAuthSetupClient
        appUrl={appUrl}
        supabaseAuthProvidersUrl={supabaseAuthProvidersUrl}
        providerFlags={{
          google: isOAuthProviderConfigured("google"),
          facebook: isOAuthProviderConfigured("facebook"),
        }}
      />
    </div>
  );
}

function supabaseDashboardAuthProvidersUrl(projectUrl: string | undefined): string {
  if (!projectUrl) return "https://supabase.com/dashboard";
  try {
    const ref = new URL(projectUrl).hostname.split(".")[0];
    if (!ref) return "https://supabase.com/dashboard";
    return `https://supabase.com/dashboard/project/${ref}/auth/providers`;
  } catch {
    return "https://supabase.com/dashboard";
  }
}
