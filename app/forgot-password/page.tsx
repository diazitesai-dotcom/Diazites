import { AuthCard } from "@/components/auth/auth-card";
import { forgotPasswordAction } from "@/services/auth/actions";

export default function ForgotPasswordPage() {
  return (
    <main className="container flex min-h-screen items-center justify-center py-12">
      <AuthCard
        title="Reset your password"
        submitText="Send reset link"
        action={forgotPasswordAction}
        footerHref="/login"
        footerText="Remember your password?"
        footerCta="Login"
        showPassword={false}
      />
    </main>
  );
}
