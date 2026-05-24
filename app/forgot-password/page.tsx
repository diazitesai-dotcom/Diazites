import { AuthCard } from "@/components/auth/auth-card";
import { forgotPasswordAction } from "@/services/auth/actions";

export default function ForgotPasswordPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(139,92,246,0.2),transparent)]" />
      <div className="relative z-[1] w-full max-w-md">
      <AuthCard
        title="Reset your password"
        submitText="Send reset link"
        pendingText="Sending…"
        action={forgotPasswordAction}
        footerHref="/login"
        footerText="Remember your password?"
        footerCta="Login"
        showPassword={false}
      />
      </div>
    </main>
  );
}
