import type { Edge, Node } from "@xyflow/react";
import {
  ragFlowIcon,
  ragFlowIconAccent,
  type RagFlowNodeData,
} from "./rag-flow-node";

const lit = "#2dd4bf";
const dim = "rgba(148, 163, 184, 0.45)";

export const RAG_FLOW_NODE_TYPES = { ragFlow: "ragFlow" } as const;

export const initialRagFlowNodes: Node<RagFlowNodeData>[] = [
  {
    id: "query",
    type: "ragFlow",
    position: { x: 0, y: 88 },
    data: {
      title: "Query",
      subtitle: "input",
      state: "done",
      badge: "done",
      icon: ragFlowIcon("query"),
      iconAccent: ragFlowIconAccent("query"),
    },
  },
  {
    id: "planner",
    type: "ragFlow",
    position: { x: 118, y: 88 },
    data: {
      title: "Planner",
      subtitle: "agent",
      state: "dim",
      icon: ragFlowIcon("planner"),
      iconAccent: ragFlowIconAccent("planner"),
    },
  },
  {
    id: "retriever",
    type: "ragFlow",
    position: { x: 236, y: 88 },
    data: {
      title: "Retriever",
      subtitle: "agent",
      state: "active",
      badge: "control",
      icon: ragFlowIcon("retriever"),
      iconAccent: ragFlowIconAccent("retriever"),
    },
  },
  {
    id: "vsearch",
    type: "ragFlow",
    position: { x: 378, y: 88 },
    data: {
      title: "Vector",
      subtitle: "search",
      state: "active",
      badge: "control",
      icon: ragFlowIcon("vsearch"),
      iconAccent: ragFlowIconAccent("vsearch"),
    },
  },
  {
    id: "evaluator",
    type: "ragFlow",
    position: { x: 496, y: 88 },
    data: {
      title: "Evaluator",
      subtitle: "agent",
      state: "dim",
      icon: ragFlowIcon("evaluator"),
      iconAccent: ragFlowIconAccent("evaluator"),
    },
  },
  {
    id: "context",
    type: "ragFlow",
    position: { x: 614, y: 88 },
    data: {
      title: "Context",
      subtitle: "assembly",
      state: "neutral",
      icon: ragFlowIcon("context"),
      iconAccent: ragFlowIconAccent("context"),
    },
  },
  {
    id: "llm",
    type: "ragFlow",
    position: { x: 732, y: 88 },
    data: {
      title: "LLM",
      subtitle: "generate",
      state: "dim",
      icon: ragFlowIcon("llm"),
      iconAccent: ragFlowIconAccent("llm"),
    },
  },
  {
    id: "grade",
    type: "ragFlow",
    position: { x: 850, y: 88 },
    data: {
      title: "Grade",
      subtitle: "hidden set",
      state: "neutral",
      icon: ragFlowIcon("grade"),
      iconAccent: ragFlowIconAccent("grade"),
    },
  },
  {
    id: "vdb",
    type: "ragFlow",
    position: { x: 378, y: 0 },
    data: {
      title: "Vector DB",
      subtitle: "chunks",
      state: "active",
      badge: "control",
      icon: ragFlowIcon("vdb"),
      iconAccent: ragFlowIconAccent("vdb"),
    },
  },
  {
    id: "metadata",
    type: "ragFlow",
    position: { x: 378, y: 176 },
    data: {
      title: "Metadata",
      subtitle: "query",
      state: "dim",
      icon: ragFlowIcon("metadata"),
      iconAccent: ragFlowIconAccent("metadata"),
    },
  },
  {
    id: "metadb",
    type: "ragFlow",
    position: { x: 496, y: 176 },
    data: {
      title: "Meta DB",
      subtitle: "filters",
      state: "dim",
      icon: ragFlowIcon("metadb"),
      iconAccent: ragFlowIconAccent("metadb"),
    },
  },
];

export const initialRagFlowEdges: Edge[] = [
  {
    id: "query-planner",
    source: "query",
    target: "planner",
    style: { stroke: dim, strokeDasharray: "5 4" },
  },
  {
    id: "query-retriever",
    source: "query",
    target: "retriever",
    style: { stroke: lit, strokeWidth: 2 },
    animated: true,
  },
  {
    id: "retriever-vsearch",
    source: "retriever",
    target: "vsearch",
    style: { stroke: lit, strokeWidth: 2 },
    animated: true,
  },
  {
    id: "vdb-vsearch",
    source: "vdb",
    target: "vsearch",
    sourceHandle: "bottom",
    targetHandle: "top",
    style: { stroke: lit, strokeWidth: 2 },
    animated: true,
  },
  {
    id: "retriever-metadata",
    source: "retriever",
    target: "metadata",
    sourceHandle: "bottom",
    targetHandle: "top",
    style: { stroke: dim, strokeDasharray: "5 4" },
  },
  {
    id: "metadata-metadb",
    source: "metadata",
    target: "metadb",
    style: { stroke: dim, strokeDasharray: "5 4" },
  },
  {
    id: "vsearch-evaluator",
    source: "vsearch",
    target: "evaluator",
    style: { stroke: dim, strokeDasharray: "5 4" },
  },
  {
    id: "evaluator-context",
    source: "evaluator",
    target: "context",
    style: { stroke: dim, strokeDasharray: "5 4" },
  },
  {
    id: "context-llm",
    source: "context",
    target: "llm",
    style: { stroke: dim, strokeDasharray: "5 4" },
  },
  {
    id: "llm-grade",
    source: "llm",
    target: "grade",
    style: { stroke: dim, strokeDasharray: "5 4" },
  },
  {
    id: "replan",
    source: "evaluator",
    target: "planner",
    sourceHandle: "bottom",
    targetHandle: "bottom",
    label: "re-plan loop",
    labelStyle: { fill: "var(--lp-muted)", fontSize: 10, fontWeight: 600 },
    labelBgStyle: { fill: "transparent" },
    style: { stroke: dim, strokeDasharray: "4 4" },
    type: "ragFlow",
  },
];
