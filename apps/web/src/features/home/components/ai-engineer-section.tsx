"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { routes } from "@/config/routes";
import { AuthLink } from "@/features/auth/auth-link";
import { simulatorPreviewApi } from "@/features/home/simulator-preview-api";
import { ApiError } from "@/lib/api-client";

type TabId = "python" | "json" | "yaml";

type SimulationTab = {
  id: TabId;
  label: string;
  fileName: string;
  code: string;
  runOutput: string;
};

type Simulation = {
  id: string;
  label: string;
  problemTitle: string;
  slug: string;
  difficulty: "Easy" | "Medium" | "Hard";
  defaultTab: TabId;
  tabs: SimulationTab[];
};

const PLACEHOLDER_SIMULATION: Simulation = {
  id: "preview",
  label: "Coming soon",
  problemTitle: "New simulators",
  slug: "",
  difficulty: "Easy",
  defaultTab: "python",
  tabs: [
    {
      id: "python",
      label: "Python",
      fileName: "pipeline.py",
      runOutput: "Catalogue reset — publish exercises to enable live grading.",
      code: `# Simulators and problems will land here.
# Configure chunking, retrieval, guardrails, and more.`,
    },
  ],
};

/** Home preview simulators — add entries when the catalogue is live again. */
const SIMULATIONS: Simulation[] = [];

function CodeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 7L3 12l5 5M16 7l5 5-5 5M13 5l-2 14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="5.5" y="5.5" width="7.5" height="7.5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M4.5 10.5h-1a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v1"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4.5 3.2v9.6l7.5-4.8-7.5-4.8z" fill="currentColor" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M6 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function defaultSimulation(): Simulation {
  return SIMULATIONS[0] ?? PLACEHOLDER_SIMULATION;
}

export function AiEngineerSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [activeId, setActiveId] = useState(() => defaultSimulation().id);
  const [activeTab, setActiveTab] = useState<TabId>(() => defaultSimulation().defaultTab);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [running, setRunning] = useState(false);
  const [runOutput, setRunOutput] = useState<string | null>(null);

  const active = useMemo(
    () => SIMULATIONS.find((item) => item.id === activeId) ?? defaultSimulation(),
    [activeId],
  );

  const currentTab = active.tabs.find((tab) => tab.id === activeTab) ?? active.tabs[0];
  const draftKey = `${activeId}:${activeTab}`;
  const editorCode = drafts[draftKey] ?? currentTab.code;
  const lineCount = Math.max(1, editorCode.split("\n").length);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  function selectSimulation(id: string) {
    const next = SIMULATIONS.find((item) => item.id === id);
    if (!next) {
      return;
    }
    setActiveId(id);
    setActiveTab(next.defaultTab);
    setCopied(false);
    setRunOutput(null);
    setRunning(false);
  }

  function selectTab(tabId: TabId) {
    setActiveTab(tabId);
    setRunOutput(null);
    setRunning(false);
  }

  function updateEditorCode(value: string) {
    setDrafts((prev) => ({ ...prev, [draftKey]: value }));
    setRunOutput(null);
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(editorCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  async function runPreview() {
    if (running) {
      return;
    }
    setRunning(true);
    setRunOutput(null);
    try {
      if (!active.slug) {
        await new Promise((resolve) => window.setTimeout(resolve, 450));
        setRunOutput(currentTab.runOutput);
        return;
      }
      const result = await simulatorPreviewApi.grade({
        simulationId: activeId,
        tabId: activeTab,
        code: editorCode,
        slug: active.slug,
      });
      setRunOutput(result.output);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Grading failed. Check your edit and try again.";
      setRunOutput(message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <section
      id="ai-engineer"
      ref={sectionRef}
      className={`ag-lc-ai${visible ? " is-visible" : ""}`}
      aria-labelledby="ag-lc-ai-title"
    >
      <div className="ag-lc-ai-glow" aria-hidden="true" />

      <div className="ag-lc-ai-inner">
        <header className="ag-lc-ai-head">
          <h2 id="ag-lc-ai-title" className="ag-lc-ai-title">
            AI Engineer
          </h2>
          <p className="ag-lc-ai-lead">
            Simulators are being rebuilt from scratch. Browse the hub for updates, or sign in
            to see problems as they publish.
          </p>
        </header>

        <div className="ag-lc-ai-workbench">
          <div className="ag-lc-ai-editor">
            <div className="ag-lc-ai-chrome">
              <div className="ag-lc-ai-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <span className="ag-lc-ai-file">{currentTab.fileName}</span>
            </div>

            <div className="ag-lc-ai-editor-bar">
              <div className="ag-lc-ai-tabs" role="tablist" aria-label="Code language">
                {active.tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    className={`ag-lc-ai-tab${activeTab === tab.id ? " is-active" : ""}`}
                    onClick={() => selectTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="ag-lc-ai-actions">
                <button
                  type="button"
                  className={`ag-lc-ai-btn ag-lc-ai-btn--ghost${copied ? " is-success" : ""}`}
                  onClick={copyCode}
                >
                  <CopyIcon />
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  type="button"
                  className={`ag-lc-ai-btn ag-lc-ai-btn--run${running ? " is-running" : ""}`}
                  onClick={runPreview}
                  disabled={running}
                >
                  <PlayIcon />
                  {running ? "Running…" : "Run"}
                </button>
                {active.slug ? (
                  <AuthLink
                    href={routes.exercise(active.slug)}
                    className="ag-lc-ai-btn ag-lc-ai-btn--dark"
                  >
                    Open Problem
                  </AuthLink>
                ) : (
                  <AuthLink href={routes.problems} className="ag-lc-ai-btn ag-lc-ai-btn--dark">
                    Problems
                  </AuthLink>
                )}
              </div>
            </div>

            <div className="ag-lc-ai-code-wrap">
              <div className="ag-lc-ai-code" role="tabpanel">
                <ol className="ag-lc-ai-lines" aria-hidden="true">
                  {Array.from({ length: lineCount }, (_, index) => (
                    <li key={index}>{index + 1}</li>
                  ))}
                </ol>
                <textarea
                  className="ag-lc-ai-editor-input"
                  value={editorCode}
                  onChange={(event) => updateEditorCode(event.target.value)}
                  spellCheck={false}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  aria-label={`Edit ${currentTab.fileName}`}
                />
              </div>

              <div
                className={`ag-lc-ai-terminal${runOutput ? " is-open" : ""}${running ? " is-busy" : ""}`}
                aria-live="polite"
              >
                <span className="ag-lc-ai-terminal-label">Output</span>
                {running ? (
                  <span className="ag-lc-ai-terminal-line">
                    <span className="ag-lc-ai-cursor" />
                    grading…
                  </span>
                ) : runOutput ? (
                  runOutput.split("\n").map((line, index) => (
                    <span key={index} className="ag-lc-ai-terminal-line">
                      {line}
                    </span>
                  ))
                ) : (
                  <span className="ag-lc-ai-terminal-line ag-lc-ai-terminal-line--muted">
                    Run to preview the grader output
                  </span>
                )}
              </div>
            </div>

            <div className="ag-lc-ai-problem">
              <span>
                Problem: <strong>{active.problemTitle}</strong>
              </span>
              <span className={`ag-lc-ai-diff ag-lc-ai-diff--${active.difficulty.toLowerCase()}`}>
                {active.difficulty}
              </span>
            </div>
          </div>

          <aside className="ag-lc-ai-sims" aria-label="Simulations">
            <p className="ag-lc-ai-sims-title">Pick a simulation</p>
            <ul className="ag-lc-ai-sim-list">
              {SIMULATIONS.map((sim, index) => {
                const isActive = sim.id === activeId;
                return (
                  <li
                    key={sim.id}
                    className="ag-lc-ai-sim-item"
                    style={{ "--ag-ai-delay": `${index * 70}ms` } as CSSProperties}
                  >
                    <button
                      type="button"
                      className={`ag-lc-ai-sim${isActive ? " is-active" : ""}`}
                      onClick={() => selectSimulation(sim.id)}
                      aria-current={isActive ? "true" : undefined}
                    >
                      <span className="ag-lc-ai-sim-icon" aria-hidden="true">
                        <CodeIcon />
                      </span>
                      <span className="ag-lc-ai-sim-copy">
                        <span className="ag-lc-ai-sim-label">{sim.label}</span>
                        <span className="ag-lc-ai-sim-problem">{sim.problemTitle}</span>
                      </span>
                      <ChevronRight />
                    </button>
                  </li>
                );
              })}
            </ul>

            <AuthLink href={routes.problems} className="ag-lc-ai-more">
              Browse all problems
              <ChevronRight />
            </AuthLink>
          </aside>
        </div>
      </div>
    </section>
  );
}
