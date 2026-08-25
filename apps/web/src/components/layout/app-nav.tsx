import Link from "next/link";
import { routes } from "@/config/routes";

const nav = [
  { href: routes.catalogue, label: "Catalogue" },
  { href: routes.progress, label: "Progress" },
];

export function AppNav() {
  return (
    <nav className="flex gap-6 text-sm">
      {nav.map((item) => (
        <Link key={item.href} href={item.href} className="hover:underline">
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
