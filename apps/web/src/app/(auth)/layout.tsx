import { brand } from "@/config/brand";
import { HomeNav } from "@/features/home/home-nav";
import "@/features/home/home.css";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="ag-page lp-auth-page">
      <HomeNav />
      <div className="lp-auth-wrap">
        <div className="ag-rings" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="lp-auth-stage">{children}</div>
        <p className="lp-auth-foot text-xs lp-muted">
          {brand.name} · {brand.endorsement}
        </p>
      </div>
    </div>
  );
}
