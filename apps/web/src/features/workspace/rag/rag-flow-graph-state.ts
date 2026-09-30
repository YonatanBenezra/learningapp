import type { Edge, Node } from "@xyflow/react";
import type { Verdict } from "@/types/grade";
import type { RagFlowNodeData, RagFlowNodeState } from "./rag-flow-node";
import { ragFlowLayoutForMode } from "./rag-flow-layouts";
import {
  activeRagFlowStep,
  ragFlowStepState,
  type RagExerciseMode,
  type RagFlowPhase,
  type RagFlowStepId,
} from "./rag-flow-steps";

const LIT = "#2dd4bf";
const DIM = "rgba(148, 163, 184, 0.45)";

const NODE_STEP: Record<string, RagFlowStepId> = {
  query: "query",
  planner: "plan",
  retriever: "retrieve",
  vsearch: "stores",
  vdb: "stores",
  metadata: "stores",
  metadb: "stores",
  evaluator: "evaluate",
  context: "context",
  llm: "generate",
  grade: "grade",
};

const METADATA_NODES = new Set(["metadata", "metadb"]);

function controlNodeId(mode: RagExerciseMode, phase: RagFlowPhase): string | null {
  if (phase !== "idle") {
    return null;
  }
  switch (mode) {
    case "prompt":
      return "llm";
    default:
      return "retriever";
  }
}

function mapStepToNodeState(
  stepVisual: "active" | "done" | "dim",
  nodeId: string,
  mode: RagExerciseMode,
  inLayout: boolean,
): RagFlowNodeState {
  if (!inLayout) {
    return "dim";
  }
  if (mode === "sandbox" && (nodeId === "vsearch" || nodeId === "vdb")) {
    return "dim";
  }
  if (METADATA_NODES.has(nodeId) && mode !== "rerank") {
    return "dim";
  }
  if (mode === "prompt" && nodeId === "retriever" && stepVisual === "active") {
    return "done";
  }
  if (stepVisual === "dim") {
    return "dim";
  }
  if (stepVisual === "done") {
    return "done";
  }
  return "active";
}

function nodeBadge(
  nodeId: string,
  state: RagFlowNodeState,
  mode: RagExerciseMode,
  phase: RagFlowPhase,
): RagFlowNodeData["badge"] {
  if (state === "done") {
    return "done";
  }
  if (state === "active" && phase === "idle" && controlNodeId(mode, phase) === nodeId) {
    return "control";
  }
  return undefined;
}

function visualActiveStep(
  mode: RagExerciseMode,
  phase: RagFlowPhase,
  runPulse: number,
): RagFlowStepId {
  if (phase === "running") {
    const pulse = ragFlowLayoutForMode(mode).runPulseSteps;
    const idx = Math.min(runPulse, pulse.length - 1);
    return pulse[idx] ?? "grade";
  }
  return activeRagFlowStep(mode, phase);
}

function edgeShouldAnimate(lit: boolean, phase: RagFlowPhase): boolean {
  return lit && phase === "running";
}

function activeNodeIdForStep(active: RagFlowStepId, mode: RagExerciseMode): string {
  switch (active) {
    case "query":
      return "query";
    case "plan":
      return "planner";
    case "retrieve":
      return "retriever";
    case "stores":
      return mode === "sandbox" ? "retriever" : "vsearch";
    case "evaluate":
      return "evaluator";
    case "context":
      return "context";
    case "generate":
      return "llm";
    case "grade":
      return "grade";
    default:
      return "query";
  }
}

export type BuildRagFlowGraphOptions = {
  mode: RagExerciseMode;
  phase: RagFlowPhase;
  runPulse?: number;
  verdict?: Verdict | null;
};

export function buildRagFlowGraph({
  mode,
  phase,
  runPulse = 0,
  verdict = null,
}: BuildRagFlowGraphOptions): { nodes: Node<RagFlowNodeData>[]; edges: Edge[] } {
  const layout = ragFlowLayoutForMode(mode);
  const visualPhase: RagFlowPhase =
    phase === "running" ? "running" : phase;
  const active = visualActiveStep(mode, phase, runPulse);

  const nodes: Node<RagFlowNodeData>[] = layout.nodes.map((node) => {
    const stepId = NODE_STEP[node.id];
    if (!stepId) {
      return node;
    }
    let stepVisual = ragFlowStepState(stepId, active, visualPhase);

    if (
      node.id === "grade" &&
      phase === "graded" &&
      verdict === "fail"
    ) {
      stepVisual = "active";
    }

    const state = mapStepToNodeState(stepVisual, node.id, mode, true);
    const badge = nodeBadge(node.id, state, mode, phase);

    return {
      ...node,
      data: {
        ...node.data,
        state,
        badge,
      },
    };
  });

  const stateById = Object.fromEntries(
    nodes.map((n) => [n.id, n.data.state]),
  ) as Record<string, RagFlowNodeState>;

  const activeNodeForPath = activeNodeIdForStep(active, mode);
  const activePathIndex = layout.pathOrder.indexOf(activeNodeForPath);

  const isLit = (source: string, target: string) => {
    const s = stateById[source];
    const t = stateById[target];
    if (!s || !t) {
      return false;
    }
    const sourceIndex = layout.pathOrder.indexOf(source);
    const targetIndex = layout.pathOrder.indexOf(target);
    if (sourceIndex >= 0 && targetIndex >= 0 && activePathIndex >= 0) {
      return sourceIndex <= activePathIndex && targetIndex <= activePathIndex;
    }
    if (s === "dim" || t === "dim") {
      return false;
    }
    return (
      (s === "done" || s === "active") &&
      (t === "done" || t === "active" || t === "neutral")
    );
  };

  const edges: Edge[] = layout.edges.map((edge) => {
    let lit = isLit(edge.source, edge.target);
    if (!lit && edge.id === "vdb-vsearch") {
      const vsearchIndex = layout.pathOrder.indexOf("vsearch");
      lit = vsearchIndex >= 0 && activePathIndex >= vsearchIndex;
    }
    return {
      ...edge,
      animated: edgeShouldAnimate(lit, phase),
      style: {
        ...edge.style,
        stroke: lit ? LIT : DIM,
        strokeWidth: lit ? 2 : 1,
        strokeDasharray: lit ? undefined : "5 4",
      },
    };
  });

  return { nodes, edges };
}

export function ragFlowModeLabel(mode: RagExerciseMode): string {
  switch (mode) {
    case "chunk":
      return "R1 · retrieval only";
    case "budget":
      return "R2 · budget";
    case "rerank":
      return "Rerank track";
    case "sandbox":
      return "Sandbox";
    case "prompt":
      return "Generation";
    default:
      return "RAG";
  }
}
