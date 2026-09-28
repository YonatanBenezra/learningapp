"use client";

import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Check,
  Circle,
  Database,
  Gauge,
  Layers,
  Search,
  Shield,
  Sparkles,
  Tag,
  Wrench,
} from "lucide-react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";

export type RagFlowNodeState = "active" | "done" | "dim" | "neutral";

export type RagFlowIconAccent = {
  fg: string;
  bg: string;
};

export type RagFlowNodeData = {
  title: string;
  subtitle?: string;
  state: RagFlowNodeState;
  badge?: "control" | "done";
  icon: LucideIcon;
  iconAccent: RagFlowIconAccent;
};

export const RAG_FLOW_ICON_ACCENTS = {
  query: { fg: "#22d3ee", bg: "rgba(34, 211, 238, 0.2)" },
  planner: { fg: "#a78bfa", bg: "rgba(167, 139, 250, 0.2)" },
  retriever: { fg: "#2dd4bf", bg: "rgba(45, 212, 191, 0.22)" },
  vsearch: { fg: "#fbbf24", bg: "rgba(251, 191, 36, 0.2)" },
  vdb: { fg: "#60a5fa", bg: "rgba(96, 165, 250, 0.2)" },
  metadata: { fg: "#fb7185", bg: "rgba(251, 113, 133, 0.2)" },
  metadb: { fg: "#818cf8", bg: "rgba(129, 140, 248, 0.2)" },
  evaluator: { fg: "#e879f9", bg: "rgba(232, 121, 249, 0.2)" },
  context: { fg: "#a3e635", bg: "rgba(163, 230, 53, 0.2)" },
  llm: { fg: "#c084fc", bg: "rgba(192, 132, 252, 0.2)" },
  grade: { fg: "#fb923c", bg: "rgba(251, 146, 60, 0.2)" },
} as const;

export function ragFlowIconAccent(id: keyof typeof RAG_FLOW_ICON_ACCENTS): RagFlowIconAccent {
  return RAG_FLOW_ICON_ACCENTS[id];
}

const ICONS = {
  query: Circle,
  planner: Bot,
  retriever: Search,
  vdb: Database,
  vsearch: Wrench,
  metadata: Tag,
  metadb: Database,
  evaluator: Gauge,
  context: Layers,
  llm: Sparkles,
  grade: Shield,
} as const;

export function ragFlowIcon(id: keyof typeof ICONS) {
  return ICONS[id];
}

export function RagFlowNode({ data }: NodeProps) {
  const node = data as RagFlowNodeData;
  const Icon = node.icon;
  const dim = node.state === "dim";
  const active = node.state === "active";
  const done = node.state === "done";

  return (
    <div
      className={cn(
        "lp-rf-node",
        active && "lp-rf-node--active",
        done && "lp-rf-node--done",
        dim && "lp-rf-node--dim",
        node.state === "neutral" && "lp-rf-node--neutral",
      )}
    >
      <Handle type="target" position={Position.Left} className="lp-rf-handle" />
      <Handle type="source" position={Position.Right} className="lp-rf-handle" />
      <Handle type="target" position={Position.Top} id="top" className="lp-rf-handle" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="lp-rf-handle" />

      {node.badge === "done" ? (
        <span className="lp-rf-badge lp-rf-badge--done" aria-hidden>
          <Check size={10} strokeWidth={3} />
        </span>
      ) : null}
      {node.badge === "control" ? (
        <span className="lp-rf-badge lp-rf-badge--control" aria-hidden />
      ) : null}

      <span
        className="lp-rf-node-icon"
        style={
          {
            "--lp-rf-icon-fg": node.iconAccent.fg,
            "--lp-rf-icon-bg": node.iconAccent.bg,
          } as CSSProperties
        }
        aria-hidden
      >
        <Icon size={14} strokeWidth={2} />
      </span>
      <span className="lp-rf-node-title">{node.title}</span>
      {node.subtitle ? <span className="lp-rf-node-sub">{node.subtitle}</span> : null}
    </div>
  );
}
