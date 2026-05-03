import { AuthCard } from "@/components/auth/auth-card";
import { loginAction } from "@/services/auth/actions";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(139,92,246,0.2),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_80%,rgba(34,211,238,0.12),transparent)]" />
      <div className="relative z-[1] w-full max-w-md">
      <AuthCard
        title="Login to Diazites AI"
        submitText="Login"
        action={loginAction}
        footerHref="/signup"
        footerText="Need an account?"
        footerCta="Start free"
      />
      </div>
    </main>
  );
}
