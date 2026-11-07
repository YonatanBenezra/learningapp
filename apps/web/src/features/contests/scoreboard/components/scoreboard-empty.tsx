import Link from "next/link";
import { routes } from "@/config/routes";

export function ScoreboardEmpty({ slug }: { slug: string }) {
  return (
    <div className="lp-sb-container flex flex-col items-center gap-4 py-24 text-center">
      <p className="text-lg font-semibold text-white">No scores yet</p>
      <p className="max-w-md text-[14px] text-[#A4B1CD]">
        When operators submit solves, ranks and the progression chart will appear here.
      </p>
      <Link
        href={routes.contestPlay(slug)}
        className="mt-2 rounded-md bg-[#9FEF00] px-4 py-2 text-[14px] font-semibold text-[#0F1520] transition-[filter] hover:brightness-105"
      >
        Enter contest
      </Link>
    </div>
  );
}
