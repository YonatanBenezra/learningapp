import Link from "next/link";
import { routes } from "@/config/routes";
import { AppNav } from "./app-nav";

export function AppHeader() {
  return (
    <header className="flex items-center justify-between border-b px-6 py-4">
      <Link href={routes.catalogue} className="font-semibold tracking-tight">
        LabPath
      </Link>
      <AppNav />
      <Link href={routes.login} className="text-sm hover:underline">
        Sign in
      </Link>
    </header>
  );
}
