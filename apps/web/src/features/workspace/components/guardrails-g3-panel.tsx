"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  FileCode2,
  FileText,
  FlaskConical,
  RotateCcw,
  Shield,
} from "lucide-react";
import { GuardrailsG3CodeField } from "./guardrails-g3-code-field";
import { G3HistoryPanel, G3ProbePanel } from "./guardrails-g3-tools";
import type { SubmissionHistoryItem } from "@/types/submission";
import type { Exercise } from "@/types/exercise";
import {
  G3_FIELD_META,
  g3StarterDefaults,
} from "../guardrails-workspace-data";
import { asSubmissionSchema, validateSubmission } from "../submission-validation";
import {
  lockedDefaults,
  schemaWithoutLocked,
  lockedFeaturesUsed,
  toolForField,
  type ToolLocks,
} from "../tool-locks";
import { ToolGroupHead } from "./tool-lock";
import { GuardrailsG3Stages } from "./guardrails-g3-stages";
import { cn } from "@/lib/utils";
import type { ExerciseTool } from "@/types/tools";

type GuardrailsG3PanelProps = {
  exercise: Exercise;
  disabled?: boolean;
  pending?: boolean;
  error?: string | null;
  initialValues?: Record<string, unknown>;
  draftVersion: number;
  historyCount?: number;
  /** Graded runs, newest first; null when they could not be loaded. */
  history?: SubmissionHistoryItem[] | null;
  onSubmit: (payload: Record<string, unknown>) => void;
  onValidityChange: (valid: boolean) => void;
  /** Practice only: layers and features the learner has not earned. */
  toolLocks?: ToolLocks | null;
};

type StackField = keyof typeof G3_FIELD_META;

const STACK_FIELDS: StackField[] = [
  "systemPrompt",
  "inputFilterYaml",
  "outputFilterYaml",
  "toolPolicyYaml",
];

/** The four layers as one string, to tell an edited stack from a saved one. */
function stackSnapshot(values: Record<string, unknown>): string {
  return JSON.stringify(STACK_FIELDS.map((key) => String(values[key] ?? "")));
}

/** Filter tokens as the grader counts them (chars / 4), before the message itself. */
function estimateFilterTokens(values: Record<string, unknown>): number {
  let tokens = 0;
  for (const key of ["inputFilterYaml", "outputFilterYaml"] as const) {
    const raw = values[key];
    if (typeof raw === "string" && raw.length > 0) {
      tokens += Math.ceil(raw.length / 4);
    }
  }
  return tokens;
}

function G3SectionHead({
  step,
  title,
  hint,
  isNew = false,
}: {
  step: number;
  title: string;
  hint: string;
  /** The exercise teaches this layer. */
  isNew?: boolean;
}) {
  return (
    <div className="lp-grd-g3-block-head">
      <h3>
        <span className="lp-grd-g3-step">{step}</span>
        <span className="lp-grd-g3-step-sep" aria-hidden>
          ·
        </span>
        <span className="lp-grd-g3-block-title">{title}</span>
        {isNew ? <em className="lp-tool-badge">New tool</em> : null}
        <span className="lp-grd-g3-block-hint">{hint}</span>
      </h3>
    </div>
  );
}

/** Defence-language features, each a tool on the G3 ladder. */
function G3Toolbox({ locks }: { locks: ToolLocks }) {
  const tools = locks.tools.filter((tool) => tool.features.length > 0);
  if (tools.length === 0) {
    return null;
  }
  return (
    <section className="lp-tool-box" aria-label="Defence-language toolbox">
      <p className="lp-tool-box-title">Defence-language toolbox</p>
      <ul className="lp-tool-box-list">
        {tools.map((tool) => (
          <li key={tool.id} className={cn(`is-${tool.state}`)}>
            <ToolGroupHead tool={tool} cost={locks.cost} onUnlock={locks.onUnlock} />
            <code>{tool.features.join(" · ")}</code>
          </li>
        ))}
      </ul>
    </section>
  );
}

function G3CodeBox({
  file,
  lang,
  value,
  disabled,
  minLines,
  onChange,
}: {
  file: string;
  lang: "yaml" | "text";
  value: string;
  disabled?: boolean;
  minLines: number;
  onChange: (next: string) => void;
}) {
  const FileIcon = lang === "yaml" ? FileCode2 : FileText;
  return (
    <div className="lp-grd-g3-codebox">
      <div className="lp-grd-g3-file-bar">
        <span className="lp-grd-g3-file-tab">
          <FileIcon className="size-3" aria-hidden />
          {file}
        </span>
        <span className="lp-grd-g3-lang-label">{lang === "yaml" ? "YAML" : "TEXT"}</span>
      </div>
      <GuardrailsG3CodeField
        value={value}
        language={lang}
        disabled={disabled}
        minLines={minLines}
        label={file}
        onChange={onChange}
      />
    </div>
  );
}

export function GuardrailsG3Panel({
  exercise,
  disabled,
  pending,
  error,
  initialValues,
  draftVersion,
  historyCount = 0,
  history = null,
  onSubmit,
  onValidityChange,
  toolLocks = null,
}: GuardrailsG3PanelProps) {
  const parsed = useMemo(() => asSubmissionSchema(exercise.submissionSchema), [exercise.submissionSchema]);
  // Locked layers are held at the exercise's defaults (an empty prompt, an
  // empty filter); what the learner wrote comes back once they unlock it.
  const held = useMemo(
    () => lockedDefaults(toolLocks, exercise.submissionSchema),
    [toolLocks, exercise.submissionSchema],
  );
  // The starter resets the editor only when the exercise or its starter
  // changes, never when a tool opens (that would wipe the learner's stack).
  const starter = useMemo(
    () => g3StarterDefaults(initialValues),
    [exercise.slug, exercise.submissionSchema, initialValues],
  );
  const defaults = useMemo(() => ({ ...starter, ...held }), [starter, held]);
  const [rawValues, setValues] = useState<Record<string, unknown>>(() =>
    g3StarterDefaults(initialValues),
  );
  const values = useMemo(() => ({ ...rawValues, ...held }), [rawValues, held]);
  const lockedInUse: ExerciseTool[] = useMemo(
    () =>
      lockedFeaturesUsed(toolLocks, [
        String(values.inputFilterYaml ?? ""),
        String(values.outputFilterYaml ?? ""),
        String(values.toolPolicyYaml ?? ""),
      ]),
    [toolLocks, values],
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<"stack" | "probe" | "history">("stack");

  useEffect(() => {
    setValues(starter);
  }, [starter]);

  const validation = useMemo(
    () => validateSubmission(schemaWithoutLocked(parsed, held), values),
    [parsed, held, values],
  );
  // "Unsaved" compares with the stack last submitted (or restored from the
  // history) in this session, and with the starter before that.
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const dirty = useMemo(
    () => stackSnapshot(values) !== (savedSnapshot ?? stackSnapshot(defaults)),
    [defaults, savedSnapshot, values],
  );
  const filterTokens = useMemo(() => estimateFilterTokens(values), [values]);

  useEffect(() => {
    onValidityChange(validation.ok);
  }, [onValidityChange, validation.ok]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validation.ok) {
      setValidationError(validation.message);
      return;
    }
    if (lockedInUse.length > 0) {
      return;
    }
    setValidationError(null);
    setSavedSnapshot(stackSnapshot(values));
    onSubmit(values);
  }

  function setField(key: StackField, next: string) {
    setValidationError(null);
    setValues((current) => ({ ...current, [key]: next }));
  }

  const editorDisabled = disabled || pending;

  return (
    <section className="lp-grd-g3">
      <div className="lp-grd-g3-workspace-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={workspaceTab === "stack"}
          className={`lp-grd-g3-tab lp-grd-g3-tab--stack${workspaceTab === "stack" ? " is-active" : ""}`}
          onClick={() => setWorkspaceTab("stack")}
        >
          <Shield className="size-3.5" aria-hidden />
          Defence stack
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={workspaceTab === "probe"}
          className={`lp-grd-g3-tab${workspaceTab === "probe" ? " is-active" : ""}`}
          onClick={() => setWorkspaceTab("probe")}
        >
          <FlaskConical className="size-3.5" aria-hidden />
          Probe
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={workspaceTab === "history"}
          className={`lp-grd-g3-tab lp-grd-g3-tab--history${workspaceTab === "history" ? " is-active" : ""}`}
          onClick={() => setWorkspaceTab("history")}
        >
          <Activity className="size-3.5" aria-hidden />
          History · {history ? history.filter((item) => item.grade).length : historyCount}
        </button>
        <span className={`lp-grd-g3-draft${dirty ? " is-unsaved" : ""}`}>
          {dirty ? <span className="lp-grd-g3-draft-dot" aria-hidden /> : null}
          <span className="lp-grd-g3-draft-ver">v{draftVersion}</span>
          {dirty ? <span className="lp-grd-g3-draft-unsaved"> · unsaved</span> : null}
        </span>
      </div>

      {workspaceTab === "history" ? (
        <div className="lp-grd-g3-history">
          <G3HistoryPanel
            history={history}
            onRestore={(payload) => {
              const restored = g3StarterDefaults(payload);
              setValues(restored);
              setSavedSnapshot(stackSnapshot({ ...restored, ...held }));
              setWorkspaceTab("stack");
            }}
          />
        </div>
      ) : workspaceTab === "probe" ? (
        <div className="lp-grd-g3-history">
          <G3ProbePanel exerciseSlug={exercise.slug} values={values} disabled={editorDisabled} />
        </div>
      ) : (
        <form className="lp-grd-g3-form lp-grd-g3-form--stack" onSubmit={handleSubmit}>
          <div className="lp-grd-g3-stack-scroll">
            {toolLocks && toolLocks.stages.length > 0 ? (
              <GuardrailsG3Stages
                exerciseSlug={exercise.slug}
                stages={toolLocks.stages}
                stack={{
                  systemPrompt: String(values.systemPrompt ?? ""),
                  inputFilterYaml: String(values.inputFilterYaml ?? ""),
                  outputFilterYaml: String(values.outputFilterYaml ?? ""),
                  toolPolicyYaml: String(values.toolPolicyYaml ?? ""),
                }}
                disabled={editorDisabled || lockedInUse.length > 0}
                onWon={toolLocks.onRefresh}
              />
            ) : null}
            {STACK_FIELDS.map((key) => {
              const meta = G3_FIELD_META[key];
              const raw = typeof values[key] === "string" ? (values[key] as string) : "";
              const minLines =
                key === "systemPrompt" ? 3 : key === "toolPolicyYaml" ? 5 : key === "outputFilterYaml" ? 4 : 7;
              const tool = toolForField(toolLocks, key);
              if (tool && toolLocks && tool.state === "locked") {
                return (
                  <div key={key} className="lp-grd-g3-block lp-tool-group is-locked">
                    <ToolGroupHead
                      tool={{ ...tool, step: meta.step }}
                      cost={toolLocks.cost}
                      onUnlock={toolLocks.onUnlock}
                    />
                  </div>
                );
              }
              return (
                <div key={key} className="lp-grd-g3-block">
                  <G3SectionHead
                    step={meta.step}
                    title={meta.title}
                    hint={meta.hint}
                    isNew={tool?.state === "new"}
                  />
                  <G3CodeBox
                    file={meta.file}
                    lang={meta.lang}
                    value={raw}
                    disabled={editorDisabled}
                    minLines={minLines}
                    onChange={(next) => setField(key, next)}
                  />
                </div>
              );
            })}
            {toolLocks ? <G3Toolbox locks={toolLocks} /> : null}
          </div>

          {lockedInUse.length > 0 ? (
            <p className="lp-tool-warn" role="alert">
              {lockedInUse
                .map(
                  (tool) =>
                    `${tool.title} (${tool.features.join(", ")}) is locked: it unlocks after ${tool.teachesIn.title}.`,
                )
                .join(" ")}{" "}
              Remove it or unlock it in the toolbox to submit.
            </p>
          ) : null}

          {(validationError || error) && (
            <p className="lp-grd-g3-error" role="alert">
              {validationError ?? error}
            </p>
          )}

          <footer className="lp-grd-g3-foot">
            <button
              type="button"
              className="lp-grd-g3-reset-link"
              disabled={disabled}
              onClick={() => setValues(starter)}
            >
              <RotateCcw className="size-3.5" aria-hidden />
              Reset to starter
            </button>
            <span
              className="lp-grd-g3-budget"
              title="Input and output filter tokens; the grader adds each message on top, and the limit is 600."
            >
              ~{filterTokens} filter tok
            </span>
            <button
              type="submit"
              className="lp-grd-g3-submit"
              disabled={disabled || pending || !validation.ok || lockedInUse.length > 0}
            >
              {pending ? "Submitting…" : "Submit defence"}
              {!pending ? <ArrowRight className="size-4" aria-hidden /> : null}
            </button>
          </footer>
        </form>
      )}
    </section>
  );
}
