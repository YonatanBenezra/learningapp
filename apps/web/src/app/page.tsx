import Link from "next/link";
import { brand } from "@/config/brand";
import { routes } from "@/config/routes";

export default function HomePage() {
  return (
    <div className="lp-shell">
      <main className="lp-hero">
        <div className="lp-hero-inner">
          <p className="lp-page-eyebrow">{brand.endorsement}</p>
          <h1 className="lp-page-title">{brand.name}</h1>
          <p className="lp-page-lead">{brand.tagline}. {brand.description}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={routes.catalogue} className="lp-btn lp-btn-primary">
              Open catalogue
            </Link>
            <Link href={routes.login} className="lp-btn lp-btn-ghost">
              Sign in
            </Link>
          </div>
        </div>
      </main>
      <footer className="lp-footer">
        {brand.name} · {brand.endorsement}
      </footer>
    </div>
  );
}
