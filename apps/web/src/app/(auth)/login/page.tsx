import { brand } from "@/config/brand";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <section className="lp-auth-card">
      <div className="lp-auth-brand">
        <p className="lp-page-eyebrow">Account access</p>
        <h1 className="lp-page-title">Sign in to {brand.name}</h1>
        <p className="lp-page-lead">
          Enter your work email to receive a secure one-time sign-in link.
        </p>
      </div>
      <LoginForm />
    </section>
  );
}
