import { brand } from "@/config/brand";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <section className="lp-auth-card">
      <div className="lp-auth-brand">
        <p className="ag-badge">
          <span aria-hidden="true">›</span>
          Account access
          <span aria-hidden="true">‹</span>
        </p>
        <h1 className="lp-auth-title">
          Sign in to <em>{brand.name}</em>
        </h1>
        <p className="lp-page-lead">
          Enter your work email to receive a secure one-time sign-in link.
        </p>
      </div>
      <LoginForm />
    </section>
  );
}
