import Link from "next/link";
import { Trophy } from "lucide-react";
import { routes } from "@/config/routes";
import { GUARDRAILS_CONTEST } from "../problems-figma-meta";

export function ProblemsContestBanner() {
  return (
    <div className="lp-prob-ctf">
      <div className="lp-prob-ctf-icon" aria-hidden>
        <Trophy className="size-5" strokeWidth={1.75} />
      </div>
      <div className="lp-prob-ctf-copy">
        <p className="lp-prob-ctf-title">{GUARDRAILS_CONTEST.title}</p>
        <p className="lp-prob-ctf-lead">{GUARDRAILS_CONTEST.copy}</p>
      </div>
      <div className="lp-prob-ctf-actions">
        <span className="lp-prob-ctf-soon">
          <span className="lp-prob-ctf-dot" aria-hidden /> {GUARDRAILS_CONTEST.startsInLabel}
        </span>
        <Link href={routes.contests} className="lp-prob-ctf-btn">
          View contest →
        </Link>
      </div>
    </div>
  );
}
