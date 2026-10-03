"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { routes } from "@/config/routes";

export function AuthMobileTop() {
  return (
    <div className="lc-auth-mobile-top">
      <Link href={routes.home} className="lc-auth-back">
        <ArrowLeft className="size-[1.05rem]" strokeWidth={2.25} aria-hidden />
        Back
      </Link>
    </div>
  );
}
