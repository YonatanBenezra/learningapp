"use client";

import "./guardrails-g3-tools.css";
import Link from "next/link";
import { useMemo, useState } from "react";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";
import type { SubmissionHistoryItem } from "@/types/submission";
import { simulationsApi, type G3Probe } from "../simulations-api";

/* ---------------------------------------------------------------- probe -- */

const LAYER_LABEL: Record<string, string> = {
  systemPrompt: "system prompt",
  inputFilterYaml: "input filter",
  outputFilterYaml: "output filter",
  toolPolicyYaml: "tool policy",
};

/**
 * One message through the stack in the editor (saved or not), layer by
 * layer, the way the grader runs it. Not graded; rate limited.
 */
export function G3ProbePanel({
  exerciseSlug,
  values,
  disabled,
}: {
  exerciseSlug: string;
  values: Record<string, unknown>;
  disabled?: boolean;
}) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<G3Probe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const text = (key: string) => (typeof values[key] === "string" ? (values[key] as string) : "");

  async function run() {
    if (!message.trim() || pending) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      setResult(
        await simulationsApi.g3Probe(exerciseSlug, message.trim(), {
          systemPrompt: text("systemPrompt"),
          inputFilterYaml: text("inputFilterYaml"),
          outputFilterYaml: text("outputFilterYaml"),
          toolPolicyYaml: text("toolPolicyYaml"),
        }),
      );
    } catch (caught: unknown) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "Probe failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="lp-grd-probe">
      <label className="lp-grd-probe-label" htmlFor="g3-probe-message">
        Try one message against the stack in the editor. Not graded.
      </label>
      <textarea
        id="g3-probe-message"
        className="lp-grd-probe-input"
        rows={3}
        value={message}
        placeholder="Write an attack, or an ordinary guest message, to see what each layer does"
        onChange={(event) => setMessage(event.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            void run();
          }
        }}
        disabled={disabled}
      />
      <div className="lp-grd-probe-actions">
        <button
          type="button"
          className="lp-grd-all-levels-btn"
          disabled={disabled || pending || !message.trim()}
          onClick={() => void run()}
        >
          {pending ? "Running…" : "Run through my stack"}
        </button>
        <span className="lp-grd-probe-hint">⌘ ↵ to run</span>
      </div>
      {error ? (
        <p className="lp-grd-all-levels-error" role="alert">
          {error}
        </p>
      ) : null}
      <div aria-live="polite">{result ? <G3CaseSteps step={result} probe={result} /> : null}</div>
    </div>
  );
}

type CaseStep = {
  message?: string;
  input: { blocked: boolean; failed: string[] };
  reply: string | null;
  tools: { tool: string; args: Record<string, unknown>; allowed: boolean; reason: string; stripped: string[] }[];
  output: { blocked: boolean; redacted: boolean; failed: string[] };
  shown: string;
};

function argsLine(args: Record<string, unknown>): string {
  return Object.entries(args)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([key, value]) => `${key}=${typeof value === "string" ? value : JSON.stringify(value)}`)
    .join(" · ");
}

/** The layers one message went through: shared by the probe and the trace page. */
export function G3CaseSteps({ step, probe }: { step: CaseStep; probe?: G3Probe }) {
  const verdict = probe
    ? probe.attack
      ? probe.harmsLeft.length === 0
        ? { tone: "pass", text: `Attack stopped${probe.taskDone === false ? ", but the guest's own task was lost" : ""}` }
        : { tone: "fail", text: `Attack got through: ${probe.harmsLeft.join("; ")}` }
      : step.input.blocked || step.output.blocked || step.output.redacted || step.tools.some((t) => !t.allowed || t.stripped.length > 0)
        ? { tone: "fail", text: "Read as a guest message, but a layer stopped or changed it" }
        : { tone: "pass", text: "Read as a guest message, and it went through untouched" }
    : null;
  return (
    <ol className="lp-grd-steps">
      <li className={cn("lp-grd-step", step.input.blocked ? "is-stop" : "is-pass")}>
        <strong>Input filter</strong>
        <span>
          {step.input.blocked
            ? `blocked (${step.input.failed.join(", ") || "flagged"})`
            : step.input.failed.length > 0
              ? `passed (failed but not enough to block: ${step.input.failed.join(", ")})`
              : "passed"}
        </span>
      </li>
      {step.reply !== null ? (
        <li className="lp-grd-step">
          <strong>Concierge</strong>
          <span className="lp-grd-step-text">{step.reply}</span>
        </li>
      ) : null}
      {step.tools.map((tool, index) => (
        <li key={index} className={cn("lp-grd-step", tool.allowed ? "is-pass" : "is-stop")}>
          <strong>{tool.tool}</strong>
          <span>
            {tool.allowed ? "ran" : `denied (${tool.reason})`}
            {tool.stripped.length > 0 ? ` · removed ${tool.stripped.join(", ")}` : ""}
          </span>
          <code>{argsLine(tool.args)}</code>
        </li>
      ))}
      {step.reply !== null ? (
        <li
          className={cn(
            "lp-grd-step",
            step.output.blocked ? "is-stop" : step.output.redacted ? "is-warn" : "is-pass",
          )}
        >
          <strong>Output filter</strong>
          <span>
            {step.output.blocked
              ? `blocked (${step.output.failed.join(", ")})`
              : step.output.redacted
                ? `redacted (${step.output.failed.join(", ")})`
                : "passed"}
          </span>
        </li>
      ) : null}
      <li className="lp-grd-step">
        <strong>Shown</strong>
        <span className="lp-grd-step-text">{step.shown}</span>
      </li>
      {verdict ? (
        <li className={cn("lp-grd-step lp-grd-step--verdict", verdict.tone === "pass" ? "is-pass" : "is-stop")}>
          <strong>{verdict.text}</strong>
          {probe ? (
            <span>
              {probe.classifierCalls} classifier · {probe.judgeCalls} judge · +{probe.addedLatencyMs} ms
            </span>
          ) : null}
        </li>
      ) : null}
    </ol>
  );
}

/* -------------------------------------------------------------- history -- */

type Gate = { id: string; metric: string; actual?: number; passed?: boolean; value?: number };
type Family = { stopped: number; total: number };

function gatesOf(item: SubmissionHistoryItem): Gate[] {
  return Array.isArray(item.grade?.gateResults) ? (item.grade!.gateResults as Gate[]) : [];
}

function familiesOf(item: SubmissionHistoryItem): Record<string, Family> {
  const breakdown = item.grade?.breakdown as { byCategory?: Record<string, Family> } | null | undefined;
  return breakdown?.byCategory ?? {};
}

const GATE_LABEL: Record<string, string> = {
  attack_block_rate: "attack block",
  benign_pass_rate: "benign pass",
  min_family_block_rate: "weakest family",
  utility_under_attack: "task done",
  judge_calls_per_request: "judge / msg",
  filter_tokens: "filter tokens",
};

function gateText(gate: Gate | undefined): string {
  if (!gate || typeof gate.actual !== "number") {
    return "—";
  }
  return gate.metric === "filter_tokens"
    ? String(Math.round(gate.actual))
    : gate.metric === "judge_calls_per_request"
      ? gate.actual.toFixed(2)
      : `${Math.round(gate.actual * 100)}%`;
}

/**
 * Graded runs of this exercise, newest first, and what changed between the
 * selected run and the one before it: the layers edited, every gate, every
 * family. Counts only; no hidden message text.
 */
export function G3HistoryPanel({
  history,
  onRestore,
}: {
  history: SubmissionHistoryItem[] | null;
  onRestore: (payload: Record<string, unknown>) => void;
}) {
  const graded = useMemo(() => (history ?? []).filter((item) => item.grade), [history]);
  const [selected, setSelected] = useState(0);
  if (history === null) {
    return <p className="lp-grd-g3-history-note">Sign in to see your earlier runs.</p>;
  }
  if (graded.length === 0) {
    return <p className="lp-grd-g3-history-note">No graded runs yet. Submit the stack to see it here.</p>;
  }
  const index = Math.min(selected, graded.length - 1);
  const current = graded[index];
  const previous = graded[index + 1] ?? null;
  const gates = gatesOf(current);
  const before = previous ? gatesOf(previous) : [];
  const families = familiesOf(current);
  const familiesBefore = previous ? familiesOf(previous) : {};
  const edited = previous
    ? Object.keys(LAYER_LABEL).filter(
        (key) => JSON.stringify(current.payload[key] ?? "") !== JSON.stringify(previous.payload[key] ?? ""),
      )
    : [];
  const n = (item: SubmissionHistoryItem) => graded.length - graded.indexOf(item);

  return (
    <div className="lp-grd-history">
      <ul className="lp-grd-history-list" aria-label="Graded runs, newest first">
        {graded.map((item, i) => {
          const g = gatesOf(item);
          const attack = g.find((row) => row.metric === "attack_block_rate");
          const benign = g.find((row) => row.metric === "benign_pass_rate");
          return (
            <li key={item.submissionId}>
              <button
                type="button"
                className={cn("lp-grd-history-row", i === index && "is-active")}
                aria-pressed={i === index}
                onClick={() => setSelected(i)}
              >
                <span>#{n(item)}</span>
                <span className={item.grade?.verdict === "pass" ? "is-pass" : "is-fail"}>{item.grade?.verdict}</span>
                <span>attack {gateText(attack)}</span>
                <span>benign {gateText(benign)}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <section className="lp-grd-history-diff" aria-label="Selected run compared with the run before it">
        <div className="lp-grd-history-head">
          <strong>
            Run #{n(current)}
            {previous ? ` vs #${n(previous)}` : ""}
          </strong>
          <span>
            {current.run ? (
              <Link href={routes.trace(current.run.id)} className="lp-link">
                Trace
              </Link>
            ) : null}
            <button type="button" className="lp-grd-hint-unlock" onClick={() => onRestore(current.payload)}>
              Load this stack
            </button>
          </span>
        </div>
        {previous ? (
          <p className="lp-grd-history-edited">
            {edited.length > 0
              ? `Edited: ${edited.map((key) => LAYER_LABEL[key]).join(", ")}`
              : "Same stack as the run before."}
          </p>
        ) : (
          <p className="lp-grd-history-edited">Your first graded run.</p>
        )}
        <table className="lp-grd-history-table">
          <thead>
            <tr>
              <th scope="col">Gate or family</th>
              <th scope="col">{previous ? `#${n(previous)}` : ""}</th>
              <th scope="col">#{n(current)}</th>
            </tr>
          </thead>
          <tbody>
            {gates.map((gate) => {
              const old = before.find((row) => row.id === gate.id);
              const changed = old && gateText(old) !== gateText(gate);
              return (
                <tr key={gate.id}>
                  <th scope="row">{GATE_LABEL[gate.metric] ?? gate.metric}</th>
                  <td>{previous ? gateText(old) : ""}</td>
                  <td className={cn(gate.passed === false ? "is-fail" : "is-pass", changed && "is-changed")}>
                    {gateText(gate)}
                  </td>
                </tr>
              );
            })}
            {Object.entries(families)
              .sort(([a], [b]) => Number(a.startsWith("benign")) - Number(b.startsWith("benign")))
              .map(([family, row]) => {
                const old = familiesBefore[family];
                const label = (r: Family | undefined) =>
                  r ? (family.startsWith("benign") ? `${r.total - r.stopped}/${r.total}` : `${r.stopped}/${r.total}`) : "—";
                return (
                  <tr key={family} className="lp-grd-history-family">
                    <th scope="row">{family}</th>
                    <td>{previous ? label(old) : ""}</td>
                    <td>{label(row)}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
