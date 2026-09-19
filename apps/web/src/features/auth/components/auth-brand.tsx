import Link from "next/link";
import { brand } from "@/config/brand";
import { routes } from "@/config/routes";

export function AuthBrand() {
  return (
    <Link href={routes.home} className="lc-auth-brand">
      <span className="lc-auth-mark" aria-hidden="true">
        <svg viewBox="0 0 20 20" width="16" height="16" fill="none">
          <path
            d="M5 6.5h6.2L7.8 13.5H14"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="lc-auth-logo-name">{brand.name}</span>
    </Link>
  );
}
