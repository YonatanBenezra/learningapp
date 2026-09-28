"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  activeRagFlowStep,
  RAG_FLOW_STEPS,
  ragModeFromSchema,
  stepCaption,
  type RagFlowStepId,
} from "../rag/rag-flow-steps";
import "../rag/rag-flow-canvas.css";

type RagFlowCanvasProps = {
  schema?: unknown;
  pending?: boolean;
  graded?: boolean;
  compact?: boolean;
  className?: string;
};

function phaseFromFlags(pending?: boolean, graded?: boolean): "idle" | "running" | "graded" {
  if (pending) {
    return "running";
  }
  if (graded) {
    return "graded";
  }
  return "idle";
}

function stepState(
  stepId: RagFlowStepId,
  active: RagFlowStepId,
  phase: "idle" | "running" | "graded",
): "active" | "done" | "dim" {
  const order = RAG_FLOW_STEPS.map((s) => s.id);
  const ai = order.indexOf(active);
  const si = order.indexOf(stepId);
  if (si === ai) {
    return phase === "graded" ? "done" : "active";
  }
  if (phase === "graded" && si < ai) {
    return "done";
  }
  if (si < ai) {
    return "done";
  }
  if (stepId === "plan" || stepId === "evaluate") {
    return "dim";
  }
  if (stepId === "generate" && active !== "generate" && active !== "grade") {
    return "dim";
  }
  return "dim";
}

export function RagFlowCanvas({
  schema,
  pending = false,
  graded = false,
  compact = false,
  className,
}: RagFlowCanvasProps) {
  const mode = useMemo(() => ragModeFromSchema(schema), [schema]);
  const phase = phaseFromFlags(pending, graded);
  const active = activeRagFlowStep(mode, phase);
  const caption = stepCaption(mode, active);
  const modeLabel =
    mode === "chunk"
      ? "R1 · retrieval only"
      : mode === "budget"
        ? "R2 · budget"
        : mode === "rerank"
          ? "Rerank track"
          : mode === "sandbox"
            ? "Sandbox"
            : "Generation";
  const stepIndex = RAG_FLOW_STEPS.findIndex((s) => s.id === active) + 1;

  return (
    <div
      className={cn("lp-rag-flow", compact && "lp-rag-flow--compact", className)}
      aria-label="Agentic RAG pipeline"
    >
      <div className="lp-rag-flow-head">
        <div className="lp-rag-flow-head-text">
          <span className="lp-rag-flow-kicker">Agentic RAG flow</span>
          <span className="lp-rag-flow-mode">{modeLabel}</span>
        </div>
        <span className="lp-rag-flow-step-pill">
          Step {stepIndex} of {RAG_FLOW_STEPS.length} ·{" "}
          {RAG_FLOW_STEPS.find((s) => s.id === active)?.short}
        </span>
      </div>
      <p className="lp-rag-flow-caption">{caption}</p>
      <div className="lp-rag-flow-track" role="list">
        {RAG_FLOW_STEPS.map((step, index) => {
          const state = stepState(step.id, active, phase);
          const isStores = step.id === "stores";
          return (
            <div key={step.id} className="lp-rag-flow-item-wrap" role="listitem">
              {index > 0 ? (
                <span
                  className={cn(
                    "lp-rag-flow-connector",
                    state === "done" || state === "active" ? "is-lit" : "",
                  )}
                  aria-hidden
                />
              ) : null}
              <div
                className={cn(
                  "lp-rag-flow-node",
                  `lp-rag-flow-node--${state}`,
                  isStores && "lp-rag-flow-node--wide",
                )}
                title={step.label}
              >
                <span className="lp-rag-flow-node-num">{index + 1}</span>
                <span className="lp-rag-flow-node-label">
                  {compact ? step.short : step.label}
                </span>
                {isStores && !compact ? (
                  <span className="lp-rag-flow-node-sub">Vector · Metadata</span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
