import { routes } from "@/config/routes";
import { AuthLink } from "@/features/auth/auth-link";

const nav = [
  { href: routes.home, label: "Home" },
  { href: routes.catalogue, label: "Catalogue" },
  { href: routes.leaderboard, label: "Leaderboard" },
  { href: routes.contests, label: "Contests" },
  { href: routes.paths, label: "Paths" },
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
