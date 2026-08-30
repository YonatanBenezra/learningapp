import { routes } from "@/config/routes";
import { AuthLink } from "@/features/auth/auth-link";

const nav = [
  { href: routes.catalogue, label: "Catalogue" },
  { href: routes.progress, label: "Progress" },
  { href: routes.billing, label: "Billing" },
];

export function AppNav() {
  return (
    <nav className="lp-nav" aria-label="Main">
      {nav.map((item) => (
        <AuthLink key={item.href} href={item.href} className="lp-nav-link">
          {item.label}
        </AuthLink>
      ))}
    </nav>
  );
}
