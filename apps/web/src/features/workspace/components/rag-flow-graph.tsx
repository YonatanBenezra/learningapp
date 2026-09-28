"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
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
import {
  initialRagFlowEdges,
  initialRagFlowNodes,
  RAG_FLOW_NODE_TYPES,
} from "../rag/rag-flow-data";
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

  useEffect(() => {
    fitView({ padding: 0.15, duration: 0 });
  }, [fitView]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }
    const observer = new ResizeObserver(() => {
      if (userMovedRef.current) {
        return;
      }
      fitView({ padding: 0.15, duration: 120 });
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, [fitView, rootRef, userMovedRef]);

  return null;
}

type RagFlowGraphProps = {
  stepLabel?: string;
  caption?: string;
  className?: string;
};

function RagFlowGraphCanvas({
  stepLabel = "Step 3 of 11 · Retriever",
  caption = "Your chunking shapes what the retriever can find.",
  className,
}: RagFlowGraphProps) {
  const [nodes, , onNodesChange] = useNodesState(initialRagFlowNodes);
  const edges = useMemo(() => initialRagFlowEdges, []);
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
            R1 · retrieval only
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
          fitView
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
