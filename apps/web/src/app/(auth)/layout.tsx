import "@/features/auth/auth.css";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="lc-auth-page">{children}</div>;
}
