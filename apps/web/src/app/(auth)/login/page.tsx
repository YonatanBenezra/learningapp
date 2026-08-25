import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <section className="w-full max-w-sm">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight">Sign in</h1>
      <LoginForm />
    </section>
  );
}
