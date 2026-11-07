import Link from "next/link";
import { brand } from "@/config/brand";
import { routes } from "@/config/routes";

const LINKS = [
  { label: "Contact Us", href: routes.contact },
  { label: "User Agreement", href: routes.home },
  { label: "Privacy Notice", href: routes.home },
  { label: "Cookie Settings", href: routes.home },
] as const;

export function EventDetailsFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-[#232C3D] py-10 md:mt-40">
      <div className="flex flex-col flex-wrap items-center justify-center gap-4 text-center text-sm text-[#A4B1CD] sm:flex-row sm:gap-6">
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
