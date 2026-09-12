import Link from "next/link";
import { routes } from "@/config/routes";
import "../contests.css";

type Tone = "closed" | "locked" | "missing" | "error";

const ICONS: Record<Tone, React.ReactElement> = {
  closed: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.4V12l3 1.8" />
    </>
  ),
  locked: (
    <>
      <rect x="4.5" y="10.5" width="15" height="9" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </>
  ),
  missing: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M15.8 15.8 20 20" />
    </>
  ),
  error: (
    <>
      <path d="M12 4.5 21 19.5H3L12 4.5Z" />
      <path d="M12 10v4" />
      <path d="M12 16.6v.1" />
    </>
  ),
};

type ContestStateProps = {
  tone: Tone;
  title: string;
  body: string;
  contestSlug: string;
  action?: { href: string; label: string };
};

export function ContestState({
  tone,
  title,
  body,
  contestSlug,
  action,
}: ContestStateProps) {
  return (
    <main className="lp-ctd-state">
      <div className="lp-ctd-state-card">
        <span className={`lp-ctd-state-icon lp-ctd-state-icon--${tone}`}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {ICONS[tone]}
          </svg>
        </span>
        <h1 className="lp-ctd-state-title">{title}</h1>
        <p className="lp-ctd-state-copy">{body}</p>
        <div className="lp-ctd-state-actions">
          <Link href={routes.contest(contestSlug)} className="lp-ct-btn">
            Back to contest
          </Link>
          {action ? (
            <Link href={action.href} className="lp-ct-btn lp-ct-btn--ghost">
              {action.label}
            </Link>
          ) : (
            <Link
              href={routes.catalogue}
              className="lp-ct-btn lp-ct-btn--ghost"
            >
              Browse catalogue
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

/** Maps an API failure to something a learner can act on. */
export function contestProblemState(
  status: number | null,
  message: string | null,
): Omit<ContestStateProps, "contestSlug"> {
  if (status === 401) {
    return {
      tone: "locked",
      title: "Sign in to continue",
      body: "Contest problems open only for the account that entered the contest.",
      action: { href: routes.login, label: "Sign in" },
    };
  }
  if (status === 400) {
    return {
      tone: "closed",
      title: "This attempt is closed",
      body: "Your contest time box has ended, so the problems can no longer be opened. Your score and verdicts are on the contest page.",
    };
  }
  if (status === 403) {
    return {
      tone: "locked",
      title: "You have not entered this contest",
      body: "Problems are drawn when you enter. Contests are Pro only, and hints stay off for the whole time box.",
      action: { href: routes.billing, label: "See plans" },
    };
  }
  if (status === 404) {
    return {
      tone: "missing",
      title: "Not one of your problems",
      body: "Every entry samples its own problems from a hidden pool. This one was not drawn for you.",
    };
  }
  return {
    tone: "error",
    title: "Could not load this problem",
    body:
      message ??
      "Something went wrong on the way to the contest. Check that the API is running, then try again.",
  };
}
