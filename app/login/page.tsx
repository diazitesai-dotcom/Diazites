import { AuthCard } from "@/components/auth/auth-card";
import { loginAction } from "@/services/auth/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const rawError = sp.error;
  const rawSuccess = sp.success;

  const safeDecode = (s: string) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  };

  const rawNext = sp.next;
  const returnPath = typeof rawNext === "string" ? rawNext : "/dashboard";

  const errorMsg = typeof rawError === "string" ? safeDecode(rawError) : null;
  const successMsg =
    typeof rawSuccess === "string"
      ? rawSuccess === "password-updated"
        ? "Password updated. You can sign in now."
        : safeDecode(rawSuccess)
      : null;

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(139,92,246,0.2),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_80%,rgba(34,211,238,0.12),transparent)]" />
      <div className="relative z-[1] w-full max-w-md space-y-4">
        {errorMsg ? (
          <p
            role="alert"
            className="rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-100"
          >
            {errorMsg}
          </p>
        ) : null}
        {successMsg ? (
          <p className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {successMsg}
          </p>
        ) : null}
        <AuthCard
          title="Sign in to Diazites"
          submitText="Sign in"
          pendingText="Signing in…"
          action={loginAction}
          returnPath={returnPath}
          footerHref={
            returnPath !== "/dashboard"
              ? `/signup?next=${encodeURIComponent(returnPath)}`
              : "/signup"
          }
          footerText="Need an account?"
          footerCta="Start free"
        />
      </div>
    </main>
  );
}
