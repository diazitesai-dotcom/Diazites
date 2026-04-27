import { AuthCard } from "@/components/auth/auth-card";
import { loginAction } from "@/services/auth/actions";

export default function LoginPage() {
  return (
    <main className="container flex min-h-screen items-center justify-center py-12">
      <AuthCard
        title="Login to Diazites AI"
        submitText="Login"
        action={loginAction}
        footerHref="/signup"
        footerText="Need an account?"
        footerCta="Start free"
      />
    </main>
  );
}
