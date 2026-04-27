import { AuthCard } from "@/components/auth/auth-card";
import { signupAction } from "@/services/auth/actions";

export default function SignupPage() {
  return (
    <main className="container flex min-h-screen items-center justify-center py-12">
      <AuthCard
        title="Create your Diazites AI account"
        submitText="Create account"
        action={signupAction}
        footerHref="/login"
        footerText="Already have an account?"
        footerCta="Login"
      />
    </main>
  );
}
