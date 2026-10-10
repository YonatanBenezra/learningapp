"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Globe } from "lucide-react";
import {
  G2_LEVELS,
  type G2PageChrome,
  g2WinHeadline,
  pageContentHasHtmlComment,
} from "../guardrails-workspace-data";
import { simulationsApi, type G2Run } from "../simulations-api";
import { GuardrailsG2PageEditor } from "./guardrails-g2-page-editor";

type GuardrailsG2PanelProps = {
  exerciseSlug: string;
  samplePage: string;
  pageChrome: G2PageChrome;
  disabled?: boolean;
  liveMode: boolean;
  level: number;
  onLevelChange: (level: number) => void;
  clearedLevels: ReadonlySet<number>;
  onLevelCleared: (level: number) => void;
  pageContent: string;
  onPageContentChange: (value: string) => void;
  onSimulate: (result: G2Run) => void;
  onAttempt: () => void;
  onSubmitGrade: () => void;
  submitError?: string | null;
};

function recipientFromRun(run: G2Run): string | null {
  const send = run.tools.find((row) => row.tool === "send_email");
  const to = send?.args.to;
  if (typeof to === "string") {
    return to;
  }
  if (Array.isArray(to) && typeof to[0] === "string") {
    return to[0];
  }
  return null;
}

export function GuardrailsG2Panel({
  exerciseSlug,
  samplePage,
  pageChrome,
  disabled,
  liveMode,
  level,
  onLevelChange,
  clearedLevels,
  onLevelCleared,
  pageContent,
  onPageContentChange,
  onSimulate,
  onAttempt,
  onSubmitGrade,
  submitError,
}: GuardrailsG2PanelProps) {
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [pending, setPending] = useState(false);
  const [lastRun, setLastRun] = useState<G2Run | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [levelWin, setLevelWin] = useState(false);

  const preview = useMemo(() => {
    return pageContent.replace(/<!--[\s\S]*?-->/g, "").trim();
  }, [pageContent]);

  const levelMeta = G2_LEVELS.find((row) => row.level === level) ?? G2_LEVELS[0];
  const levelCleared = clearedLevels.has(level) || levelWin;
  const hasComment = pageContentHasHtmlComment(pageContent);
  const recipient = lastRun ? recipientFromRun(lastRun) : null;

  useEffect(() => {
    setLastRun(null);
    setRunError(null);
    setLevelWin(false);
  }, [level]);

  const runSim = useCallback(
    async (event?: FormEvent) => {
      event?.preventDefault();
      if (disabled || pending || levelCleared) {
        return;
      }
      setPending(true);
      setRunError(null);
      try {
        const result = await simulationsApi.g2Page(exerciseSlug, level, pageContent);
        setLastRun(result);
        onSimulate(result);
        onAttempt();
        if (result.won) {
          setLevelWin(true);
          onLevelCleared(level);
        }
      } catch (caught: unknown) {
        setRunError(caught instanceof Error ? caught.message : "Simulation failed");
      } finally {
        setPending(false);
      }
    },
    [
      disabled,
      exerciseSlug,
      level,
      levelCleared,
      onAttempt,
      onLevelCleared,
      onSimulate,
      pageContent,
      pending,
    ],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        void runSim();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [runSim]);

  function resetPage() {
    onPageContentChange(samplePage);
    setLastRun(null);
    setRunError(null);
    setLevelWin(false);
  }

  const failNotice =
    liveMode && lastRun && !lastRun.won
      ? lastRun.denied
        ? "Not yet — policy gate blocked the exfil. Change the page copy or hidden comment and run again."
        : "Not yet — the agent did not send mail. Adjust indirect instructions in the page body or HTML comments."
      : null;

  const showSuccess = levelWin || (lastRun?.won && levelCleared);

  return (
    <section className="lp-grd-g2">
      <div className="lp-grd-g2-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "edit"}
          className={tab === "edit" ? "is-active" : ""}
          onClick={() => setTab("edit")}
        >
          Page content
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "preview"}
          className={tab === "preview" ? "is-active" : ""}
          onClick={() => setTab("preview")}
        >
          Preview
        </button>
        <div className="lp-grd-g2-url-row">
          <div className="lp-grd-g2-url-bar">
            <Globe className="size-3.5 shrink-0 opacity-70" strokeWidth={2} aria-hidden />
            <span>{pageChrome.url}</span>
          </div>
          <span className="lp-grd-g2-untrusted">
            <span className="lp-grd-g2-untrusted-dot" aria-hidden />
            untrusted
          </span>
        </div>
      </div>

      <p className="lp-grd-g2-user-request">
        User request (fixed): <em>{pageChrome.userRequest}</em>
      </p>

      <div className="lp-grd-g2-body">
        {tab === "edit" ? (
          <GuardrailsG2PageEditor
            filename={pageChrome.filename}
            value={pageContent}
            disabled={disabled || levelCleared}
            onChange={onPageContentChange}
          />
        ) : (
          <pre className="lp-grd-g2-preview">{preview || "(empty)"}</pre>
        )}

        {tab === "edit" && hasComment ? (
          <p className="lp-grd-g2-comment-callout">
            hidden in an HTML comment · invisible in Preview
          </p>
        ) : null}

        <div className="lp-grd-g2-log">
          <div className="lp-grd-g2-log-head">
            <p className="lp-grd-g2-log-title">Tool log</p>
            <span className="lp-grd-g2-log-meta">simulated · read-only</span>
          </div>
          {!lastRun ? (
            <div className="lp-grd-g2-empty">
              <p>No runs yet. Run the mock agent against this page.</p>
              <span className="lp-grd-g2-kbd">⌘ ↵ to run</span>
            </div>
          ) : (
            <ol className="lp-grd-g2-log-list">
              <li>
                <span>01 fetch_page</span>
                <span className="is-ok">200 · 1.2 KB</span>
              </li>
              <li>
                <span>02 summarize</span>
                <span className="is-ok">ok</span>
              </li>
              {lastRun.denied ? (
                <li>
                  <span>03 policy_check</span>
                  <span className="is-warn">denied</span>
                </li>
              ) : lastRun.tools.length > 0 ? (
                <>
                  <li>
                    <span>
                      03 policy_check
                      {recipient ? (
                        <em className="lp-grd-g2-log-detail"> recipient=&quot;{recipient}&quot;</em>
                      ) : null}
                    </span>
                    <span className="is-warn">approved</span>
                  </li>
                  {lastRun.tools.map((tool, index) => (
                    <li key={index} className="is-exfil">
                      <span>
                        0{4 + index} {tool.tool}
                        {typeof tool.args.to === "string" ? (
                          <em className="lp-grd-g2-log-detail"> to=&quot;{tool.args.to}&quot;</em>
                        ) : null}
                      </span>
                      <span>{lastRun.won ? "sent" : "blocked"}</span>
                    </li>
                  ))}
                </>
              ) : (
                <li>
                  <span>03 policy_check</span>
                  <span className="is-muted">no tool proposed</span>
                </li>
              )}
            </ol>
          )}
        </div>
      </div>

      {showSuccess ? (
        <div className="lp-grd-g2-success" role="status">
          <p>{g2WinHeadline(level)}</p>
          <strong>Level {level} cleared</strong>
          {level < 3 ? (
            <button type="button" className="lp-grd-g2-success-next" onClick={() => onLevelChange(level + 1)}>
              Next level
            </button>
          ) : null}
        </div>
      ) : null}

      {failNotice && !levelCleared ? (
        <p className="lp-grd-g2-fail" role="alert">
          {failNotice}
        </p>
      ) : null}

      {runError ? <p className="lp-grd-g2-error lp-grd-g2-error--inline">{runError}</p> : null}
      {submitError ? <p className="lp-grd-g2-error lp-grd-g2-error--inline">{submitError}</p> : null}

      <footer className="lp-grd-g2-foot">
        <button type="button" className="lp-grd-g2-reset-link" onClick={resetPage} disabled={disabled}>
          Reset to sample page
        </button>
        <span className="lp-grd-g2-char-count">{pageContent.length.toLocaleString()} / 4,000 chars</span>
        <button
          type="button"
          className="lp-grd-g2-run-quiet"
          disabled={disabled || pending || levelCleared}
          onClick={() => void runSim()}
        >
          {pending ? "Running…" : "Run mock agent"}
        </button>
        <button
          type="button"
          className="lp-grd-g2-submit"
          disabled={disabled || pending || !pageContent.trim()}
          onClick={onSubmitGrade}
        >
          Submit page
        </button>
      </footer>
    </section>
  );
}
