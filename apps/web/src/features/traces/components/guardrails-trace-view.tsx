"use client";

import "./guardrails-trace-view.css";
import { G3CaseSteps } from "@/features/workspace/components/guardrails-g3-tools";
import { cn } from "@/lib/utils";
import type { RunTrace } from "@/types/trace";

const G1_LEVELS: Record<number, string> = {
  1: "Baseline system prompt",
  2: "Hardened system prompt",
  3: "Hardened prompt + output filter",
};
const G2_LEVELS: Record<number, string> = {
  1: "No guard: the page is read as instructions",
  2: "Untrusted wrapper around the page",
  3: "Approval policy on every email",
};

type G1Level = { level: number; won: boolean; filtered: boolean; reply: string };
type G2Level = {
  level: number;
  won: boolean;
  denied: boolean;
  summary?: string;
  tools: { tool: string; args: Record<string, unknown> }[];
};
type G3Case = Parameters<typeof G3CaseSteps>[0]["step"] & { note: string; message: string };

function isG3(trace: RunTrace): boolean {
  return Array.isArray(trace.cases);
}

/** "let-through-attack · page · sent by send_email" → heading parts. */
function caseHeading(note: string): { tone: "fail" | "pass" | "warn"; title: string; detail: string } {
  const [kind, family, ...rest] = note.split(" · ");
  const detail = [family, rest.join(" · ")].filter(Boolean).join(" · ");
  if (kind === "let-through-attack") {
    return { tone: "fail", title: "Attack got through", detail };
  }
  if (kind === "blocked-benign") {
    return { tone: "warn", title: "Guest stopped", detail };
  }
  return { tone: "pass", title: "Attack stopped", detail };
}

/**
 * The guardrails part of a run's trace: the levels a G1 or G2 payload went
 * through, or, for G3, some of the sample's messages layer by layer. G3 shows
 * only messages from the feedback part of the hidden set.
 */
export function GuardrailsTraceBody({ trace }: { trace: RunTrace }) {
  if (isG3(trace)) {
    const cases = (trace.cases ?? []) as G3Case[];
    if (cases.length === 0) {
      return <p className="lp-run-note">No messages to show for this run.</p>;
    }
    const order = { fail: 0, warn: 1, pass: 2 };
    const sorted = [...cases].sort(
      (a, b) => order[caseHeading(a.note).tone] - order[caseHeading(b.note).tone],
    );
    return (
      <section className="lp-run-panel">
        <div className="lp-run-panel-head">
          <p className="lp-run-panel-kicker">Layer by layer</p>
          <h2 className="lp-run-panel-title">Messages from the sample</h2>
          <p className="lp-run-note">
            Only messages from the part of the hidden set that may be shown; the rest is counted,
            never listed.
          </p>
        </div>
        <ul className="lp-grd-trace-cases">
          {sorted.map((row, index) => {
            const heading = caseHeading(row.note);
            return (
              <li key={index} className={cn("lp-grd-trace-case", `is-${heading.tone}`)}>
                <header>
                  <strong>{heading.title}</strong>
                  <span>{heading.detail}</span>
                </header>
                <pre className="lp-grd-trace-message">{row.message}</pre>
                <G3CaseSteps step={row} />
              </li>
            );
          })}
        </ul>
      </section>
    );
  }

  const levels = (trace.levels ?? []) as (G1Level | G2Level)[];
  if (levels.length === 0) {
    return (
      <p className="lp-run-note">
        This run was graded before per-level traces were recorded. Submit again to see them.
      </p>
    );
  }
  const g2 = levels.some((row) => "tools" in row);
  return (
    <section className="lp-run-panel">
      <div className="lp-run-panel-head">
        <p className="lp-run-panel-kicker">{g2 ? "Tool calls" : "Replies"}</p>
        <h2 className="lp-run-panel-title">Each level</h2>
      </div>
      <ol className="lp-grd-trace-levels">
        {levels.map((row) => (
          <li key={row.level} className={cn("lp-grd-trace-level", row.won ? "is-won" : "is-held")}>
            <header>
              <strong>Level {row.level}</strong>
              <span>{(g2 ? G2_LEVELS : G1_LEVELS)[row.level] ?? ""}</span>
              <em>{row.won ? "won" : "held"}</em>
            </header>
            {"tools" in row ? (
              <>
                {row.summary ? <p className="lp-run-note">{row.summary}</p> : null}
                {row.tools.length === 0 ? (
                  <p className="lp-run-note">No tool call.</p>
                ) : (
                  <ul className="lp-grd-trace-tools">
                    {row.tools.map((tool, index) => (
                      <li key={index}>
                        <code>{tool.tool}</code>
                        <span>
                          {Object.entries(tool.args)
                            .filter(([key]) => ["to", "cc", "bcc", "subject"].includes(key))
                            .map(([key, value]) => `${key}=${Array.isArray(value) ? value.join(", ") : String(value)}`)
                            .join(" · ")}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {row.denied ? <p className="lp-run-note">The approval policy denied the email.</p> : null}
              </>
            ) : (
              <p className="lp-grd-trace-reply">
                {row.filtered ? "Output filter: " : ""}
                {row.reply}
              </p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
