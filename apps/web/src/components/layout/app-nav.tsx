import Link from "next/link";
import { routes } from "@/config/routes";

const nav = [
  { href: routes.home, label: "Home" },
  { href: routes.problems, label: "Problems" },
];

export function AppNav() {
  return (
    <nav className="lp-nav" aria-label="Main">
      {nav.map((item) => (
        <Link key={item.href} href={item.href} className="lp-nav-link">
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
