import Link from "next/link";
import { brand } from "@/config/brand";
import { routes } from "@/config/routes";

const LINKS = [
  { label: "Contact", href: routes.contact },
  { label: "User Agreement", href: routes.home },
  { label: "Privacy", href: routes.home },
  { label: "Cookie Settings", href: routes.home },
] as const;

export function EventDetailsFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-[#232C3D] py-7">
      <div className="mx-auto flex max-w-[1200px] flex-col flex-wrap items-center justify-center gap-4 px-6 text-center text-[13px] text-[#6B7891] sm:flex-row sm:gap-6">
        <span>© {year} {brand.name}</span>
        {LINKS.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="transition-colors duration-150 hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </footer>
  );
}
