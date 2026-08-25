import Link from "next/link";
import { routes } from "@/config/routes";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-start gap-4 p-8">
      <h1 className="text-3xl font-semibold tracking-tight">LabPath</h1>
      <p className="max-w-xl text-sm opacity-70">
        Practice platform for AI engineering. Train here. Hire a tutor if you
        want to be taught.
      </p>
      <div className="flex gap-4 text-sm">
        <Link href={routes.catalogue} className="underline">
          Catalogue
        </Link>
        <Link href={routes.login} className="underline">
          Sign in
        </Link>
      </div>
    </main>
  );
}
