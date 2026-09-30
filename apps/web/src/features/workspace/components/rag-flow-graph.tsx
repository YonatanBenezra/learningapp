"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { Verdict } from "@/types/grade";
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useReactFlow,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { cn } from "@/lib/utils";
import { RagFlowEdge } from "../rag/rag-flow-edge";
import { RagFlowNode } from "../rag/rag-flow-node";
import { RAG_FLOW_NODE_TYPES } from "../rag/rag-flow-data";
import { buildRagFlowGraph, ragFlowModeLabel } from "../rag/rag-flow-graph-state";
import {
  activeRagFlowStep,
  RAG_FLOW_STEPS,
  ragFlowPhaseFromFlags,
  ragModeFromSchema,
  stepCaption,
} from "../rag/rag-flow-steps";
import "../rag/rag-flow-graph.css";

const nodeTypes: NodeTypes = { [RAG_FLOW_NODE_TYPES.ragFlow]: RagFlowNode };
const edgeTypes = { ragFlow: RagFlowEdge };

function FitViewOnResize({
  rootRef,
  userMovedRef,
}: {
  rootRef: RefObject<HTMLDivElement | null>;
  userMovedRef: RefObject<boolean>;
}) {
  const { fitView } = useReactFlow();
  const fitViewRef = useRef(fitView);
  fitViewRef.current = fitView;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }
    let debounce: number | null = null;
    let lastWidth = 0;
    let lastHeight = 0;
    let fitting = false;

    const runFit = (duration: number) => {
      if (userMovedRef.current) {
        return;
      }
      if (document.documentElement.classList.contains("lp-ws-split-drag")) {
        return;
      }
      if (fitting) {
        return;
      }
      fitting = true;
      fitViewRef.current({ padding: 0.15, duration });
      window.setTimeout(() => {
        fitting = false;
      }, duration + 50);
    };

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      const { width, height } = entry.contentRect;
      if (
        lastWidth > 0 &&
        Math.abs(width - lastWidth) < 2 &&
        Math.abs(height - lastHeight) < 2
      ) {
        return;
      }
      lastWidth = width;
      lastHeight = height;

      if (debounce) {
        window.clearTimeout(debounce);
      }
      debounce = window.setTimeout(() => runFit(120), 200);
    });
    observer.observe(root);

    const initialFit = window.requestAnimationFrame(() => {
      const rect = root.getBoundingClientRect();
      lastWidth = rect.width;
      lastHeight = rect.height;
      runFit(0);
    });

    const onSplitEnd = () => {
      if (debounce) {
        window.clearTimeout(debounce);
        debounce = null;
      }
      lastWidth = 0;
      lastHeight = 0;
      runFit(0);
    };
    window.addEventListener("lp-ws-split-resize-end", onSplitEnd);

    return () => {
      window.cancelAnimationFrame(initialFit);
      observer.disconnect();
      window.removeEventListener("lp-ws-split-resize-end", onSplitEnd);
      if (debounce) {
        window.clearTimeout(debounce);
      }
    };
  }, [rootRef, userMovedRef]);

  return null;
}

type RagFlowGraphProps = {
  schema?: unknown;
  pending?: boolean;
  graded?: boolean;
  verdict?: Verdict | null;
  className?: string;
};

function RagFlowGraphCanvas({
  schema,
  pending = false,
  graded = false,
  verdict = null,
  className,
}: RagFlowGraphProps) {
  const mode = useMemo(() => ragModeFromSchema(schema), [schema]);
  const phase = ragFlowPhaseFromFlags(pending, graded);
  const [runPulse, setRunPulse] = useState(0);

  useEffect(() => {
    if (!pending) {
      setRunPulse(0);
      return;
    }
    const tick = window.setInterval(() => {
      setRunPulse((n) => n + 1);
    }, 480);
    return () => window.clearInterval(tick);
  }, [pending]);

  const graph = useMemo(
    () =>
      buildRagFlowGraph({
        mode,
        phase,
        runPulse,
        verdict: graded ? verdict : null,
      }),
    [mode, phase, runPulse, graded, verdict],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes);
  const edges = graph.edges;

  useEffect(() => {
    setNodes(graph.nodes);
  }, [graph.nodes, setNodes]);

  const active = activeRagFlowStep(mode, phase);
  const caption = stepCaption(mode, active);
  const stepIndex = RAG_FLOW_STEPS.findIndex((s) => s.id === active) + 1;
  const stepShort = RAG_FLOW_STEPS.find((s) => s.id === active)?.short ?? "Step";
  const stepLabel = `Step ${stepIndex} of ${RAG_FLOW_STEPS.length} · ${stepShort}`;
  const modeLabel = ragFlowModeLabel(mode);

  const canvasRef = useRef<HTMLDivElement>(null);
  const userMovedViewportRef = useRef(false);

  return (
    <section
      className={cn(
        "lp-rag-graph flex min-h-0 flex-col border-b border-lp-border bg-[color-mix(in_srgb,var(--color-ink)_14%,var(--color-card))]",
        className,
      )}
      aria-label="Agentic RAG flow"
    >
      <header className="flex flex-wrap items-start justify-between gap-2 px-3 pt-2.5 pb-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="m-0 text-[0.9375rem] font-semibold text-lp-ink">Agentic RAG flow</p>
          <span className="rounded-full border border-lp-border px-2 py-0.5 text-[0.625rem] font-semibold text-lp-muted">
            {modeLabel}
          </span>
        </div>
        <ul className="m-0 flex list-none flex-wrap gap-3 p-0 text-[0.625rem] font-semibold text-lp-muted">
          <li className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-lp-brand ring-2 ring-lp-brand/30" />
            you control
          </li>
          <li className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-lp-brand" />
            done
          </li>
          <li className="flex items-center gap-1">
            <span className="size-1.5 rounded-full border border-dashed border-lp-muted bg-transparent" />
            not in R1
          </li>
        </ul>
      </header>

      <div
        ref={canvasRef}
        className="lp-rag-graph-canvas mx-1 min-h-[12rem] flex-1 bg-lp-inset"
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{ type: "ragFlow" }}
          fitViewOptions={{ padding: 0.15, minZoom: 0.35, maxZoom: 1.75 }}
          minZoom={0.25}
          maxZoom={2.5}
          nodesDraggable
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={[1, 2]}
          nodeDragThreshold={2}
          panOnScroll={false}
          zoomOnScroll
          zoomOnPinch
          zoomOnDoubleClick={false}
          preventScrolling
          onMoveStart={() => {
            userMovedViewportRef.current = true;
          }}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={14}
            size={1}
            color="rgb(51 65 85 / 0.85)"
          />
          <Controls
            showInteractive={false}
            position="bottom-right"
            className="lp-rag-graph-controls"
          />
          <FitViewOnResize rootRef={canvasRef} userMovedRef={userMovedViewportRef} />
        </ReactFlow>
      </div>

      <footer className="flex items-center justify-between gap-2 border-t border-lp-border/60 px-3 py-1.5">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-[0.6875rem] font-bold text-lp-brand">{stepLabel}</span>
          <span className="text-[0.6875rem] text-lp-muted">{caption}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            className="grid size-7 place-items-center rounded border border-lp-border bg-lp-elevated text-sm text-lp-muted"
            aria-label="Previous step"
          >
            ‹
          </button>
          <button
            type="button"
            className="grid size-7 place-items-center rounded border border-lp-border bg-lp-elevated text-sm text-lp-muted"
            aria-label="Next step"
          >
            ›
          </button>
        </div>
      </footer>
    </section>
  );
}

export function RagFlowGraph(props: RagFlowGraphProps) {
  return (
    <ReactFlowProvider>
      <RagFlowGraphCanvas {...props} />
    </ReactFlowProvider>
  );
}
