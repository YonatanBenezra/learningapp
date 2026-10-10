"use client";

import { useEffect, useMemo, useState } from "react";
import type { Exercise } from "@/types/exercise";
import type { Grade } from "@/types/grade";
import type { Run } from "@/types/run";
import type { HintList } from "@/types/hint";
import { buildG1Debrief, type G1LevelWin } from "../guardrails-g1-debrief";
import { buildGuardrailsFigmaBrief } from "../guardrails-brief-from-exercise";
import {
  G1_LEVELS,
  G2_LEVELS,
  g2PageChrome,
  g2SamplePage,
  g1SimulatorProfile,
  guardrailsVariantForExercise,
  sampleIndexFromSeed,
} from "../guardrails-workspace-data";
import { defaultsFromSubmissionSchema } from "../figma-brief-from-exercise";
import { GuardrailsG1ChatPanel } from "./guardrails-g1-chat-panel";
import { GuardrailsLeftPanel } from "./guardrails-left-panel";
import { GuardrailsG2Panel } from "./guardrails-g2-panel";
import { GuardrailsG3Panel } from "./guardrails-g3-panel";
import { GuardrailsWorkspaceChrome } from "./guardrails-workspace-chrome";
import { RunPanel } from "./run-panel";
import { WorkspaceSplit } from "./workspace-split";
import "../workspace.css";
import "../workspace-guardrails-figma.css";

type WorkspaceGuardrailsFigmaShellProps = {
  slug: string;
  exercise: Exercise;
  pathSlug?: string;
  hints?: HintList | null;
  run: Run | null;
  grade: Grade | null;
  pending: boolean;
  submitError: string | null;
  initialValues?: Record<string, unknown>;
  onSubmit: (payload: Record<string, unknown>) => void;
  onValidityChange: (valid: boolean) => void;
  briefCollapsed: boolean;
  onToggleBriefCollapsed: () => void;
  resultsCollapsed: boolean;
  onToggleResultsCollapsed: () => void;
};

export function WorkspaceGuardrailsFigmaShell({
  exercise,
  pathSlug,
  hints = null,
  run,
  grade,
  pending,
  submitError,
  initialValues,
  onSubmit,
  onValidityChange,
  briefCollapsed,
  onToggleBriefCollapsed,
  resultsCollapsed,
  onToggleResultsCollapsed,
}: WorkspaceGuardrailsFigmaShellProps) {
  const variant = guardrailsVariantForExercise(exercise)!;
  const g1Simulator = useMemo(
    () => g1SimulatorProfile(exercise),
    [exercise.slug, exercise.title],
  );
  const [liveMode, setLiveMode] = useState(true);
  const [activeLevel, setActiveLevel] = useState(1);
  const [clearedLevels, setClearedLevels] = useState<Set<number>>(() => new Set());
  const [chatAttempts, setChatAttempts] = useState(0);
  const [gradeAttempts, setGradeAttempts] = useState(0);
  const [attackDraft, setAttackDraft] = useState("");
  const [gradeAttackPrompt, setGradeAttackPrompt] = useState("");
  const [pageContent, setPageContent] = useState(() => g2SamplePage(exercise));
  const [g1WinsByLevel, setG1WinsByLevel] = useState<Record<number, G1LevelWin>>({});
  const [g1ShowDebrief, setG1ShowDebrief] = useState(false);

  const figmaBrief = useMemo(
    () =>
      buildGuardrailsFigmaBrief(exercise, {
        hints,
        submissionCount: gradeAttempts,
      }),
    [exercise, hints, gradeAttempts],
  );

  const formDefaults = useMemo(
    () => defaultsFromSubmissionSchema(exercise.submissionSchema, initialValues),
    [exercise.submissionSchema, initialValues],
  );

  useEffect(() => {
    if (variant !== "g2") {
      return;
    }
    if (
      typeof formDefaults.pageContent === "string" &&
      formDefaults.pageContent.trim()
    ) {
      setPageContent(formDefaults.pageContent);
      return;
    }
    setPageContent(g2SamplePage(exercise));
  }, [exercise.slug, formDefaults.pageContent, variant]);

  useEffect(() => {
    setG1ShowDebrief(false);
  }, [activeLevel]);

  const submitAttackPrompt = attackDraft.trim() || gradeAttackPrompt.trim();

  useEffect(() => {
    if (variant === "g1") {
      onValidityChange(Boolean(submitAttackPrompt));
      return;
    }
    if (variant === "g2") {
      onValidityChange(Boolean(pageContent.trim()));
    }
  }, [onValidityChange, pageContent, submitAttackPrompt, variant]);

  const levelRows = variant === "g2" ? G2_LEVELS : G1_LEVELS;
  const levelMeta = levelRows.find((row) => row.level === activeLevel) ?? levelRows[0];
  const attempts = variant === "g1" ? chatAttempts : gradeAttempts + chatAttempts;
  const g3SampleIndex = sampleIndexFromSeed(grade?.scorecard?.sampleSeed);
  const g3ChromeMeta =
    variant === "g3"
      ? g3SampleIndex
        ? `Attempt ${gradeAttempts + 1} · sample #${g3SampleIndex}`
        : `Attempt ${gradeAttempts + 1}`
      : undefined;

  const handleGradeSubmit = (payload: Record<string, unknown>) => {
    setGradeAttempts((n) => n + 1);
    onSubmit(payload);
  };

  const submitGrade = () => {
    if (!submitAttackPrompt) {
      return;
    }
    handleGradeSubmit({ attackPrompt: submitAttackPrompt });
  };

  const activeLevelCleared = clearedLevels.has(activeLevel);
  const g1Debrief =
    variant === "g1" && g1ShowDebrief && g1WinsByLevel[activeLevel]
      ? buildG1Debrief(g1WinsByLevel[activeLevel])
      : null;

  const levelChrome = (
    <GuardrailsWorkspaceChrome
      exercise={exercise}
      levelTitle={
        activeLevelCleared
          ? variant === "g2"
            ? `Level ${activeLevel} cleared`
            : `Level ${activeLevel} cleared · ${levelMeta.title}`
          : levelMeta.title
      }
      levelProgress={activeLevelCleared ? 1 : 0.35 + activeLevel * 0.2}
      levelCleared={activeLevelCleared}
      attempts={attempts}
      activeLevel={activeLevel}
      liveMode={liveMode}
      tone={variant === "g2" ? "amber" : "default"}
      showLivePill={variant !== "g2"}
    />
  );

  const workPrimary =
    variant === "g1" ? (
      <div className="lp-grd-work lp-grd-work--g1">
        <GuardrailsG1ChatPanel
          exerciseSlug={exercise.slug}
          simulator={g1Simulator}
          disabled={pending}
          liveMode={liveMode}
          level={activeLevel}
          onLevelChange={setActiveLevel}
          clearedLevels={clearedLevels}
          onLevelCleared={(level) =>
            setClearedLevels((current) => new Set(current).add(level))
          }
          onAttempt={() => setChatAttempts((n) => n + 1)}
          onDraftChange={setAttackDraft}
          onLevelWin={(win) => {
            setG1WinsByLevel((current) => ({ ...current, [win.level]: win }));
            if (win.attackPrompt) {
              setGradeAttackPrompt(win.attackPrompt);
              setAttackDraft(win.attackPrompt);
            }
          }}
          onViewDebrief={() => setG1ShowDebrief(true)}
          onSubmitGrade={submitGrade}
          gradeSubmitDisabled={pending || !submitAttackPrompt}
          submitError={submitError}
          gradePending={pending}
        />
      </div>
    ) : variant === "g2" ? (
      <div className="lp-grd-work lp-grd-work--g2">
        <GuardrailsG2Panel
          exerciseSlug={exercise.slug}
          samplePage={g2SamplePage(exercise)}
          pageChrome={g2PageChrome(exercise)}
          disabled={pending}
          liveMode={liveMode}
          level={activeLevel}
          onLevelChange={setActiveLevel}
          clearedLevels={clearedLevels}
          onLevelCleared={(level) =>
            setClearedLevels((current) => new Set(current).add(level))
          }
          pageContent={pageContent}
          onPageContentChange={setPageContent}
          onSimulate={() => setChatAttempts((n) => n + 1)}
          onAttempt={() => setChatAttempts((n) => n + 1)}
          onSubmitGrade={() => handleGradeSubmit({ pageContent })}
          submitError={submitError}
        />
      </div>
    ) : (
      <div className="lp-grd-work lp-grd-work--g3">
        <GuardrailsG3Panel
          exercise={exercise}
          disabled={pending}
          pending={pending}
          error={submitError}
          initialValues={formDefaults}
          draftVersion={gradeAttempts + 1}
          historyCount={gradeAttempts}
          onSubmit={handleGradeSubmit}
          onValidityChange={onValidityChange}
        />
      </div>
    );

  const showResults =
    variant === "g3" ||
    gradeAttempts > 0 ||
    pending ||
    Boolean(run || grade || submitError);

  const leftPanel = (
      <GuardrailsLeftPanel
        exercise={exercise}
        variant={variant}
        activeLevel={activeLevel}
        clearedLevels={clearedLevels}
        liveMode={liveMode}
        onLiveModeChange={setLiveMode}
        hints={figmaBrief.hints}
        debrief={g1Debrief}
        onDismissDebrief={() => setG1ShowDebrief(false)}
        collapsed={briefCollapsed}
        onToggleCollapse={onToggleBriefCollapsed}
      />
    );

  return (
    <div className="lp-ws lp-ws--guardrails lp-ws--grd-figma">
      {variant === "g1" || variant === "g2" ? levelChrome : null}
      {variant === "g3" ? (
        <GuardrailsWorkspaceChrome
          exercise={exercise}
          levelTitle="Defence stack"
          levelProgress={grade?.verdict === "pass" ? 1 : 0.55}
          levelCleared={grade?.verdict === "pass"}
          attempts={gradeAttempts}
          liveMode={false}
          showLivePill={false}
          tone="default"
          chromeMeta={g3ChromeMeta}
        />
      ) : null}
      <WorkspaceSplit
        storageKey="lp-ws-grd-brief-ratio"
        defaultRatio={variant === "g3" ? 0.32 : 0.34}
        minPrimary={280}
        minSecondary={480}
        handleVariant="pill"
        primaryCollapsed={briefCollapsed}
        primary={leftPanel}
        secondary={
          showResults ? (
            <WorkspaceSplit
              storageKey="lp-ws-grd-center-ratio"
              defaultRatio={0.62}
              minPrimary={360}
              minSecondary={280}
              handleVariant="pill"
              className="lp-ws-split--stack"
              secondaryCollapsed={resultsCollapsed}
              primary={<div className="lp-grd-center-host">{workPrimary}</div>}
              secondary={
                <RunPanel
                  run={run}
                  grade={grade}
                  simulator="guardrails"
                  pending={pending}
                  attempt={gradeAttempts || 1}
                  exerciseSlug={exercise.slug}
                  collapsed={resultsCollapsed}
                  onToggleCollapse={onToggleResultsCollapsed}
                  figmaScorecard
                  figmaGuardScorecard
                />
              }
            />
          ) : (
            <div className="lp-grd-center-host">{workPrimary}</div>
          )
        }
      />
    </div>
  );
}
