import type { Edge, Node } from "@xyflow/react";
import type { Verdict } from "@/types/grade";
import {
  ragFlowIcon,
  ragFlowIconAccent,
  type RagFlowNodeData,
  type RagFlowNodeState,
} from "./rag-flow-node";

export const RAG_FLOW_NODE_TYPE = "ragFlow";

export type RagExerciseMode =
  | "chunk"
  | "budget"
  | "hybrid"
  | "filter"
  | "packing"
  | "multihop"
  | "prompt"
  | "rerank"
  | "rerankOnly"
  | "routing"
  | "redteam"
  | "sandbox";

export type RagFlowPhase = "idle" | "running" | "graded";

type IconKey = Parameters<typeof ragFlowIcon>[0];

/** One stage the grader really runs, in order. */
export type PipelineStage = {
  id: string;
  title: string;
  subtitle: string;
  icon: IconKey;
  /** The learner's config changes this stage. */
  control: boolean;
  /** What the grader does here, shown when the stage is focused. */
  detail: string;
};

/** Which grader archetype a submission schema belongs to. */
export function ragModeFromSchema(schema: unknown): RagExerciseMode {
  const properties =
    (schema as { properties?: Record<string, unknown> })?.properties ?? {};
  return ragModeFromKeys(Object.keys(properties));
}

/** Same as ragModeFromSchema, from a submitted payload's field names. */
export function ragModeFromKeys(keys: string[]): RagExerciseMode {
  if (keys.length === 1 && keys[0] === "source") {
    return "sandbox";
  }
  if (keys.length === 1 && keys[0] === "flag") {
    return "redteam";
  }
  if (keys.includes("faqTopK")) {
    return "routing";
  }
  if (keys.includes("generationPrompt")) {
    return "prompt";
  }
  if (keys.includes("queryRewritePrompt")) {
    return "rerank";
  }
  if (keys.includes("reranker")) {
    // Rerank exercises that do not offer a query rewrite.
    return "rerankOnly";
  }
  if (keys.includes("statusFilter")) {
    return "filter";
  }
  if (keys.includes("dedupe")) {
    return "packing";
  }
  if (keys.includes("hops")) {
    return "multihop";
  }
  if (keys.includes("retrievalMode")) {
    return "hybrid";
  }
  if (keys.includes("topK")) {
    return "budget";
  }
  return "chunk";
}

export function ragFlowPhaseFromFlags(
  pending?: boolean,
  graded?: boolean,
): RagFlowPhase {
  if (pending) {
    return "running";
  }
  return graded ? "graded" : "idle";
}

const QUERY: PipelineStage = {
  id: "query",
  title: "Query",
  subtitle: "hidden set",
  icon: "query",
  control: false,
  detail: "Each hidden-set question runs through the same pipeline.",
};

/** Mirrors the graders in apps/api/src/modules/grading/harnesses. */
const PIPELINES: Record<
  Exclude<RagExerciseMode, "rerankOnly">,
  PipelineStage[]
> = {
  chunk: [
    QUERY,
    {
      id: "chunker",
      title: "Chunker",
      subtitle: "you control",
      icon: "vdb",
      control: true,
      detail:
        "Your chunk size, overlap and split strategy cut every document into chunks.",
    },
    {
      id: "search",
      title: "BM25",
      subtitle: "top 5",
      icon: "vsearch",
      control: false,
      detail: "BM25 keyword search ranks the chunks and keeps the top 5.",
    },
    {
      id: "context",
      title: "Context",
      subtitle: "token budget",
      icon: "context",
      control: false,
      detail:
        "The top-5 chunks form the context; their size counts against the token budget.",
    },
    {
      id: "grade",
      title: "Grade",
      subtitle: "recall@5 · tokens",
      icon: "grade",
      control: false,
      detail:
        "Pass when the gold sentence is in the top 5 often enough, within the budget.",
    },
  ],
  budget: [
    QUERY,
    {
      id: "chunker",
      title: "Chunks",
      subtitle: "you set size",
      icon: "vdb",
      control: true,
      detail:
        "Documents are packed into whole-sentence chunks up to your chunk size.",
    },
    {
      id: "search",
      title: "BM25",
      subtitle: "you set top-k",
      icon: "vsearch",
      control: true,
      detail:
        "BM25 keyword search returns your top-k chunks (4× top-k candidates when rerank is on).",
    },
    {
      id: "rerank",
      title: "Rerank",
      subtitle: "optional",
      icon: "evaluator",
      control: true,
      detail:
        "When on, chunks whose document title matches the query move to the top.",
    },
    {
      id: "context",
      title: "Context",
      subtitle: "sent in full",
      icon: "context",
      control: false,
      detail:
        "Every retrieved chunk is sent in full; prompt tokens are counted on exactly this text.",
    },
    {
      id: "grade",
      title: "Grade",
      subtitle: "recall@k · tokens",
      icon: "grade",
      control: false,
      detail:
        "Pass when the gold sentence is in the context often enough, within the token budget.",
    },
  ],
  prompt: [
    QUERY,
    {
      id: "search",
      title: "Retrieval",
      subtitle: "fixed",
      icon: "vsearch",
      control: false,
      detail:
        "Retrieval is locked: BM25 plus title boost over whole documents, top 5.",
    },
    {
      id: "context",
      title: "Context",
      subtitle: "chunk ids",
      icon: "context",
      control: false,
      detail:
        "The top-5 chunks are passed to the generator with their chunk ids.",
    },
    {
      id: "llm",
      title: "Generator",
      subtitle: "your prompt",
      icon: "llm",
      control: true,
      detail:
        "Your generation prompt decides citation format and when to refuse.",
    },
    {
      id: "grade",
      title: "Grade",
      subtitle: "citations · refusals",
      icon: "grade",
      control: false,
      detail:
        "Checks citation format, gold-span overlap of cited chunks, and refusal behaviour.",
    },
  ],
  multihop: [
    QUERY,
    {
      id: "search",
      title: "Search 1",
      subtitle: "you set top-k",
      icon: "vsearch",
      control: true,
      detail:
        "BM25 over whole pages with the question as asked; it usually finds the first link of the chain.",
    },
    {
      id: "hop",
      title: "Search 2",
      subtitle: "optional hop",
      icon: "planner",
      control: true,
      detail:
        "With two hops, a second BM25 search runs on the question plus what the first search found: whole passages, or only the new names in them.",
    },
    {
      id: "context",
      title: "Context",
      subtitle: "both searches",
      icon: "context",
      control: false,
      detail:
        "Results of every search are sent in full and count toward the token budget.",
    },
    {
      id: "grade",
      title: "Grade",
      subtitle: "full chain · tokens",
      icon: "grade",
      control: false,
      detail:
        "A question counts only when every page of its chain is in the context.",
    },
  ],
  packing: [
    QUERY,
    {
      id: "search",
      title: "BM25",
      subtitle: "you set top-k",
      icon: "vsearch",
      control: true,
      detail:
        "BM25 keyword search over whole wiki pages returns your top-k candidates.",
    },
    {
      id: "dedupe",
      title: "Dedupe",
      subtitle: "you set it",
      icon: "evaluator",
      control: true,
      detail:
        "Drops a page that duplicates a higher-ranked one: identical text (exact) or enough shared words (near, by your threshold).",
    },
    {
      id: "context",
      title: "Pack",
      subtitle: "token budget",
      icon: "context",
      control: false,
      detail:
        "Pages are added in rank order while they fit the token budget; the rest are left out.",
    },
    {
      id: "grade",
      title: "Grade",
      subtitle: "recall · tokens",
      icon: "grade",
      control: false,
      detail:
        "Pass when the answer page makes it into the packed context often enough.",
    },
  ],
  filter: [
    QUERY,
    {
      id: "search",
      title: "BM25",
      subtitle: "whole documents",
      icon: "vsearch",
      control: false,
      detail:
        "BM25 keyword search over whole documents, every version of every policy included.",
    },
    {
      id: "filter",
      title: "Filter",
      subtitle: "you set it",
      icon: "evaluator",
      control: true,
      detail:
        "Your status filter keeps documents by their metadata. Pre runs it before top-k; post takes the top k first and then drops what fails.",
    },
    {
      id: "context",
      title: "Context",
      subtitle: "what survives",
      icon: "context",
      control: false,
      detail:
        "Every chunk that survives the filter is sent in full; two versions of one policy in context count as stale.",
    },
    {
      id: "grade",
      title: "Grade",
      subtitle: "recall · stale · tokens",
      icon: "grade",
      control: false,
      detail:
        "Pass when the current version reaches the context, no other version does, and the prompt fits the budget.",
    },
  ],
  hybrid: [
    QUERY,
    {
      id: "chunker",
      title: "Chunks",
      subtitle: "one per doc",
      icon: "vdb",
      control: false,
      detail: "Each document is short enough to be a single chunk.",
    },
    {
      id: "search",
      title: "Retrieve",
      subtitle: "you pick the mode",
      icon: "vsearch",
      control: true,
      detail:
        "BM25 keyword match, dense embedding similarity (bge-small), or hybrid: both rescaled per question and mixed by your alpha. Your top-k chunks are kept.",
    },
    {
      id: "context",
      title: "Context",
      subtitle: "sent in full",
      icon: "context",
      control: false,
      detail:
        "Every retrieved chunk is sent in full; prompt tokens are counted on exactly this text.",
    },
    {
      id: "grade",
      title: "Grade",
      subtitle: "recall@k · tokens",
      icon: "grade",
      control: false,
      detail:
        "Pass when the answer's document is in the context often enough, within the token budget.",
    },
  ],
  rerank: [
    QUERY,
    {
      id: "rewrite",
      title: "Rewrite",
      subtitle: "optional LLM call",
      icon: "llm",
      control: true,
      detail:
        "An optional query-rewrite prompt adds one model call per question; the first stage then searches for the rewritten query.",
    },
    {
      id: "search",
      title: "First stage",
      subtitle: "keyword count",
      icon: "vsearch",
      control: false,
      detail: "A deliberately weak keyword count fills the candidate window.",
    },
    {
      id: "rerank",
      title: "Reranker",
      subtitle: "you choose",
      icon: "evaluator",
      control: true,
      detail:
        "Your reranker and window size reorder the candidates; the top 5 are kept.",
    },
    {
      id: "grade",
      title: "Grade",
      subtitle: "nDCG gain · tokens",
      icon: "grade",
      control: false,
      detail:
        "Pass when nDCG@5 improves enough over the first stage within token and call caps.",
    },
  ],
  routing: [
    QUERY,
    {
      id: "router",
      title: "Router",
      subtitle: "you build it",
      icon: "planner",
      control: true,
      detail:
        "Your router picks each question's profile: rules you write, the type of the best-matching document, or one default profile.",
    },
    {
      id: "profiles",
      title: "Profiles",
      subtitle: "you control",
      icon: "retriever",
      control: true,
      detail:
        "One top-k / rerank / chunk size profile per class. Chunks are whole sentences packed up to that size.",
    },
    {
      id: "search",
      title: "BM25",
      subtitle: "per profile",
      icon: "vsearch",
      control: false,
      detail:
        "BM25 keyword search over that profile's chunks, with the title boost when the profile reranks.",
    },
    {
      id: "context",
      title: "Context",
      subtitle: "sent in full",
      icon: "context",
      control: false,
      detail:
        "Every retrieved chunk is sent in full; prompt tokens are averaged over all classes.",
    },
    {
      id: "grade",
      title: "Grade",
      subtitle: "recall per class · tokens",
      icon: "grade",
      control: false,
      detail:
        "Pass when each class meets its recall bar and the mean prompt stays within budget.",
    },
  ],
  redteam: [
    {
      id: "query",
      title: "Your message",
      subtitle: "Target bot tab",
      icon: "query",
      control: true,
      detail:
        "Everything you type in the Target bot tab goes to the vulnerable bot. Nothing there is graded.",
    },
    {
      id: "filter",
      title: "Input filter",
      subtitle: "blocks some asks",
      icon: "evaluator",
      control: false,
      detail:
        "A simple filter refuses some words and, on later levels, direct injection phrasing.",
    },
    {
      id: "search",
      title: "Retrieval",
      subtitle: "tenant index",
      icon: "vsearch",
      control: false,
      detail:
        "Keyword search over the knowledge base. How it filters, and what it trusts, is the bug you are looking for.",
    },
    {
      id: "llm",
      title: "Bot",
      subtitle: "vulnerable",
      icon: "llm",
      control: false,
      detail:
        "The bot answers from what it retrieved and trusts more than it should.",
    },
    {
      id: "grade",
      title: "Flag",
      subtitle: "you submit",
      icon: "grade",
      control: true,
      detail: "Submit the flag you extracted. Only an exact match passes.",
    },
  ],
  sandbox: [
    QUERY,
    {
      id: "code",
      title: "Your code",
      subtitle: "Python",
      icon: "retriever",
      control: true,
      detail:
        "Your Python retriever returns passages for every question in a sandbox.",
    },
    {
      id: "grade",
      title: "Grade",
      subtitle: "recall@5",
      icon: "grade",
      control: false,
      detail:
        "Pass when the gold sentence is in your top 5 passages often enough.",
    },
  ],
};

const MODE_LABELS: Record<RagExerciseMode, string> = {
  chunk: "R1 · chunking",
  budget: "R2 · cost-capped retrieval",
  hybrid: "R2 · hybrid search",
  filter: "R2 · metadata filter",
  packing: "R2 · context packing",
  multihop: "R2 · multi-hop retrieval",
  prompt: "R3 · grounded generation",
  rerank: "R4 · rerank",
  rerankOnly: "R4 · rerank",
  sandbox: "Custom retriever",
  routing: "R5 · query routing",
  redteam: "Red team · flag capture",
};

export function pipelineForMode(mode: RagExerciseMode): PipelineStage[] {
  if (mode === "rerankOnly") {
    return PIPELINES.rerank.filter((stage) => stage.id !== "rewrite");
  }
  return PIPELINES[mode];
}

export function ragFlowModeLabel(mode: RagExerciseMode): string {
  return MODE_LABELS[mode];
}

const LIT = "#2dd4bf";
const DIM = "rgba(148, 163, 184, 0.45)";
const STAGE_GAP = 128;

function stageState(
  stage: PipelineStage,
  phase: RagFlowPhase,
  verdict: Verdict | null,
): RagFlowNodeState {
  if (phase === "running") {
    return "active";
  }
  if (phase === "graded") {
    return stage.id === "grade" && verdict === "fail" ? "fail" : "done";
  }
  return stage.control ? "active" : "neutral";
}

export function buildPipelineGraph({
  mode,
  phase,
  verdict = null,
  focusedId = null,
}: {
  mode: RagExerciseMode;
  phase: RagFlowPhase;
  verdict?: Verdict | null;
  focusedId?: string | null;
}): { nodes: Node<RagFlowNodeData>[]; edges: Edge[] } {
  const stages = pipelineForMode(mode);
  const nodes: Node<RagFlowNodeData>[] = stages.map((stage, index) => {
    const state = stageState(stage, phase, verdict);
    return {
      id: stage.id,
      type: RAG_FLOW_NODE_TYPE,
      position: { x: index * STAGE_GAP, y: 72 },
      data: {
        title: stage.title,
        subtitle: stage.subtitle,
        state,
        badge:
          state === "done"
            ? "done"
            : phase === "idle" && stage.control
              ? "control"
              : undefined,
        focused: stage.id === focusedId,
        icon: ragFlowIcon(stage.icon),
        iconAccent: ragFlowIconAccent(stage.icon),
      },
    };
  });
  const lit = phase !== "idle";
  const edges: Edge[] = stages.slice(1).map((stage, index) => ({
    id: `${stages[index].id}-${stage.id}`,
    source: stages[index].id,
    target: stage.id,
    type: RAG_FLOW_NODE_TYPE,
    animated: phase === "running",
    style: {
      stroke: lit ? LIT : DIM,
      strokeWidth: lit ? 2 : 1,
      strokeDasharray: lit ? undefined : "5 4",
    },
  }));
  return { nodes, edges };
}
