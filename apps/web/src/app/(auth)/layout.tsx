import { brand } from "@/config/brand";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="lp-auth-wrap">
      {children}
      <p className="mt-6 text-center text-xs lp-muted">
        {brand.name} · {brand.endorsement}
      </p>
    </div>
  );
}
