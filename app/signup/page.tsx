import { SignupCard } from "@/components/auth/signup-card";
import { signupAction } from "@/services/auth/actions";

export default function SignupPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(139,92,246,0.2),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_80%,rgba(34,211,238,0.12),transparent)]" />
      <div className="relative z-[1] w-full max-w-md">
      <SignupCard
        title="Create your Diazites AI account"
        submitText="Create account"
        pendingText="Creating account…"
        action={signupAction}
        footerHref="/login"
        footerText="Already have an account?"
        footerCta="Login"
      />
      </div>
    </main>
  );
}
