"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  ChevronRight,
  FileCode2,
  FileText,
  RotateCcw,
  Shield,
  SlidersHorizontal,
} from "lucide-react";
import { GuardrailsG3CodeField } from "./guardrails-g3-code-field";
import type { Exercise } from "@/types/exercise";
import {
  G3_FIELD_META,
  g3StarterDefaults,
} from "../guardrails-workspace-data";
import { asSubmissionSchema, validateSubmission } from "../submission-validation";

type GuardrailsG3PanelProps = {
  exercise: Exercise;
  disabled?: boolean;
  pending?: boolean;
  error?: string | null;
  initialValues?: Record<string, unknown>;
  draftVersion: number;
  historyCount?: number;
  onSubmit: (payload: Record<string, unknown>) => void;
  onValidityChange: (valid: boolean) => void;
};

type StackField = keyof typeof G3_FIELD_META;

const STACK_FIELDS: StackField[] = ["systemPrompt", "inputFilterYaml", "outputFilterYaml"];

function estimateBudget(values: Record<string, unknown>): { tokens: number; calls: number } {
  let chars = 0;
  for (const key of [...STACK_FIELDS, "toolPolicyYaml"] as StackField[]) {
    const raw = values[key];
    if (typeof raw === "string") {
      chars += raw.length;
    }
  }
  return { tokens: Math.max(120, Math.round(chars / 3.2)), calls: 1 };
}

function G3SectionHead({
  step,
  title,
  hint,
}: {
  step: number;
  title: string;
  hint: string;
}) {
  return (
    <div className="lp-grd-g3-block-head">
      <h3>
        <span className="lp-grd-g3-step">{step}</span>
        <span className="lp-grd-g3-step-sep" aria-hidden>
          ·
        </span>
        <span className="lp-grd-g3-block-title">{title}</span>
        <span className="lp-grd-g3-block-hint">{hint}</span>
      </h3>
    </div>
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
  onSubmit,
  onValidityChange,
}: GuardrailsG3PanelProps) {
  const parsed = useMemo(() => asSubmissionSchema(exercise.submissionSchema), [exercise.submissionSchema]);
  const defaults = useMemo(
    () => g3StarterDefaults(initialValues),
    [exercise.slug, exercise.submissionSchema, initialValues],
  );
  const [values, setValues] = useState<Record<string, unknown>>(() =>
    g3StarterDefaults(initialValues),
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<"stack" | "history">("stack");

  useEffect(() => {
    setValues(defaults);
  }, [defaults]);

  const validation = useMemo(() => validateSubmission(parsed, values), [parsed, values]);
  const dirty = useMemo(() => JSON.stringify(values) !== JSON.stringify(defaults), [defaults, values]);
  const budget = useMemo(() => estimateBudget(values), [values]);

  useEffect(() => {
    onValidityChange(validation.ok);
  }, [onValidityChange, validation.ok]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validation.ok) {
      setValidationError(validation.message);
      return;
    }
    setValidationError(null);
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
          aria-selected={workspaceTab === "history"}
          className={`lp-grd-g3-tab lp-grd-g3-tab--history${workspaceTab === "history" ? " is-active" : ""}`}
          onClick={() => setWorkspaceTab("history")}
        >
          <Activity className="size-3.5" aria-hidden />
          History · {historyCount}
        </button>
        <span className={`lp-grd-g3-draft${dirty ? " is-unsaved" : ""}`}>
          {dirty ? <span className="lp-grd-g3-draft-dot" aria-hidden /> : null}
          <span className="lp-grd-g3-draft-ver">v{draftVersion}</span>
          {dirty ? <span className="lp-grd-g3-draft-unsaved"> · unsaved</span> : null}
        </span>
      </div>

      {workspaceTab === "history" ? (
        <div className="lp-grd-g3-history">
          <p>Prior graded submissions appear in Dashboard and Run trace after you submit.</p>
        </div>
      ) : (
        <form className="lp-grd-g3-form lp-grd-g3-form--stack" onSubmit={handleSubmit}>
          <div className="lp-grd-g3-stack-scroll">
            {STACK_FIELDS.map((key) => {
              const meta = G3_FIELD_META[key];
              const raw = typeof values[key] === "string" ? (values[key] as string) : "";
              const minLines =
                key === "systemPrompt" ? 3 : key === "outputFilterYaml" ? 4 : 7;
              return (
                <div key={key} className="lp-grd-g3-block">
                  <G3SectionHead step={meta.step} title={meta.title} hint={meta.hint} />
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

            <div className="lp-grd-g3-block lp-grd-g3-block--tool">
              <G3SectionHead
                step={G3_FIELD_META.toolPolicyYaml.step}
                title={G3_FIELD_META.toolPolicyYaml.title}
                hint="optional"
              />
              <details className="lp-grd-g3-optional">
                <summary>
                  <SlidersHorizontal className="size-3.5" aria-hidden />
                  <ChevronRight className="size-4 lp-grd-g3-optional-chevron" aria-hidden />
                </summary>
                <G3CodeBox
                  file={G3_FIELD_META.toolPolicyYaml.file}
                  lang="yaml"
                  value={
                    typeof values.toolPolicyYaml === "string" ? values.toolPolicyYaml : ""
                  }
                  disabled={editorDisabled}
                  minLines={4}
                  onChange={(next) => setField("toolPolicyYaml", next)}
                />
              </details>
            </div>
          </div>

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
              onClick={() => setValues(defaults)}
            >
              <RotateCcw className="size-3.5" aria-hidden />
              Reset to starter
            </button>
            <span className="lp-grd-g3-budget">
              ~{budget.tokens} tok · {budget.calls} call
            </span>
            <button
              type="submit"
              className="lp-grd-g3-submit"
              disabled={disabled || pending || !validation.ok}
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
