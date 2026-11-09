import { AlertTriangle, Clock, Lock, SearchX } from "lucide-react";
import Link from "next/link";
import { routes } from "@/config/routes";
import "./contest-state.css";

type Tone = "closed" | "locked" | "missing" | "error";

const EYEBROW: Record<Tone, string> = {
  closed: "Session ended",
  locked: "Access restricted",
  missing: "Not in your pool",
  error: "Something went wrong",
};

const ICONS: Record<Tone, React.ReactNode> = {
  closed: <Clock className="size-5" strokeWidth={1.75} aria-hidden />,
  locked: <Lock className="size-5" strokeWidth={1.75} aria-hidden />,
  missing: <SearchX className="size-5" strokeWidth={1.75} aria-hidden />,
  error: <AlertTriangle className="size-5" strokeWidth={1.75} aria-hidden />,
};

type ContestStateProps = {
  tone: Tone;
  title: string;
  body: string;
  contestSlug: string;
  backHref?: string;
  backLabel?: string;
  action?: { href: string; label: string };
};

export function ContestState({
  tone,
  title,
  body,
  contestSlug,
  backHref,
  backLabel = "Contest",
  action,
}: ContestStateProps) {
  const secondary =
    action ??
    ({
      href: routes.problems,
      label: "Browse problems",
    } as const);

  return (
    <main className="contest-state" data-tone={tone}>
      <div className="contest-state__panel">
        <p className="contest-state__eyebrow">{EYEBROW[tone]}</p>
        <div className="contest-state__icon">{ICONS[tone]}</div>
        <h1 className="contest-state__title">{title}</h1>
        <p className="contest-state__body">{body}</p>
        <div className="contest-state__actions">
          <Link
            href={backHref ?? routes.ctfEvent(contestSlug)}
            className="contest-state__btn contest-state__btn--primary"
          >
            Back to {backLabel.toLowerCase()}
          </Link>
          <Link href={secondary.href} className="contest-state__btn contest-state__btn--secondary">
            {secondary.label}
          </Link>
        </div>
      </div>
    </main>
  );
}

/** Maps an API failure to something a learner can act on. */
export function contestProblemState(
  status: number | null,
  message: string | null,
  variant: "contest" | "assessment" = "contest",
): Omit<ContestStateProps, "contestSlug" | "backHref" | "backLabel"> {
  const sitting = variant === "assessment" ? "assessment" : "contest";
  if (status === 401) {
    return {
      tone: "locked",
      title: "Sign in to continue",
      body: `${sitting} problems open only for the account that started the ${sitting}.`,
      action: { href: routes.login, label: "Sign in" },
    };
  }
  if (status === 400) {
    return {
      tone: "closed",
      title: "This attempt is closed",
      body: `Your ${sitting} time box has ended, so the problems can no longer be opened. Your score and verdicts are on the ${sitting} page.`,
    };
  }
  if (status === 403) {
    return {
      tone: "locked",
      title: `You have not started this ${sitting}`,
      body:
        variant === "assessment"
          ? "Start the assessment from the assessments page first. Hints stay off for the whole time box."
          : "Enter the contest from the contest page first. Your problems are drawn when you start, and hints stay off for the whole time box.",
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
      `Something went wrong on the way to the ${sitting}. Check that the API is running, then try again.`,
  };
}
