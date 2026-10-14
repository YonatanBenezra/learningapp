"use client";

import { Activity, Check, FileText, Search, Shield, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

const CORPUS_LIT = new Set([9, 17, 30]);

const GEN_BAR_WIDTHS = [170, 146, 160, 119, 153, 94] as const;

function buildRetrieverDots() {
  let s = 11;
  const r = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  return Array.from({ length: 46 }, () => ({
    x: 10 + r() * 194,
    y: 8 + r() * 154,
  }));
}

const RETRIEVER_DOTS = buildRetrieverDots();
const QUERY = { x: 107, y: 85 };

function retrieverHitIndices() {
  const withDist = RETRIEVER_DOTS.map((d, i) => ({
    i,
    d: Math.hypot(d.x - QUERY.x, d.y - QUERY.y),
  }))
    .filter(({ d }) => d <= 46)
    .sort((a, b) => a.d - b.d)
    .slice(0, 5)
    .map(({ i }) => i);
  return new Set(withDist);
}

const RETRIEVER_HITS = retrieverHitIndices();

function FaceHeader({
  icon: Icon,
  iconColor,
  label,
  tag,
}: {
  icon: typeof FileText;
  iconColor: string;
  label: string;
  tag: string;
}) {
  return (
    <header className="pipeline-face-head">
      <Icon className="pipeline-face-icon" style={{ color: iconColor }} strokeWidth={1.75} aria-hidden />
      <span className="pipeline-face-label">{label}</span>
      <span className="pipeline-face-head-spacer" aria-hidden />
      <span className="pipeline-face-tag">{tag}</span>
    </header>
  );
}

export function CorpusFace() {
  return (
    <div className="pipeline-face-inner">
      <FaceHeader icon={FileText} iconColor="#97a1b2" label="CORPUS" tag="12,408 chunks" />
      <div className="pipeline-corpus-grid">
        {Array.from({ length: 42 }, (_, i) => (
          <span key={i} className={cn("pipeline-corpus-key", CORPUS_LIT.has(i) && "is-hit")} />
        ))}
      </div>
    </div>
  );
}

export function RetrieverFace() {
  return (
    <div className="pipeline-face-inner">
      <FaceHeader icon={Search} iconColor="#2dd4bf" label="RETRIEVER" tag="top-k 5" />
      <svg className="pipeline-retriever-svg" width={214} height={170} viewBox="0 0 214 170" aria-hidden>
        {RETRIEVER_DOTS.map((dot, i) =>
          RETRIEVER_HITS.has(i) ? (
            <line
              key={`l-${i}`}
              x1={QUERY.x}
              y1={QUERY.y}
              x2={dot.x}
              y2={dot.y}
              className="pipeline-retriever-line"
            />
          ) : null,
        )}
        {RETRIEVER_DOTS.map((dot, i) => (
          <circle
            key={i}
            cx={dot.x}
            cy={dot.y}
            r={RETRIEVER_HITS.has(i) ? 3.5 : 2}
            className={cn("pipeline-retriever-dot", RETRIEVER_HITS.has(i) && "is-hit")}
          />
        ))}
        <circle cx={QUERY.x} cy={QUERY.y} r={6} className="pipeline-retriever-query-ring" />
        <circle cx={QUERY.x} cy={QUERY.y} r={5} className="pipeline-retriever-query" />
      </svg>
    </div>
  );
}

export function GeneratorFace() {
  return (
    <div className="pipeline-face-inner">
      <FaceHeader icon={Terminal} iconColor="#7cb4ff" label="GENERATOR" tag="stream" />
      <div className="pipeline-gen-rows">
        {GEN_BAR_WIDTHS.map((w, i) => (
          <div key={i} className="pipeline-gen-row">
            <span className="pipeline-gen-bar" style={{ width: w }} />
            {i === 2 ? <span className="pipeline-gen-cite">[2]</span> : null}
            {i === 5 ? <span className="pipeline-gen-cite">[4]</span> : null}
          </div>
        ))}
      </div>
      <div className="pipeline-gen-pill">
        <Check className="pipeline-gen-pill-icon" strokeWidth={2.5} aria-hidden />
        <span>grounded · 2 citations</span>
      </div>
    </div>
  );
}

type GraderFaceProps = {
  score: string;
  barsVisible: number;
  showDelta?: boolean;
};

export function GraderFace({ score, barsVisible, showDelta = false }: GraderFaceProps) {
  return (
    <div className="pipeline-face-inner pipeline-face-inner--grader">
      <FaceHeader icon={Shield} iconColor="#ff7a45" label="GRADER" tag="hidden set" />
      <div className="pipeline-grader-score-row">
        <span className="pipeline-grader-score">{score}</span>
        {showDelta ? <span className="pipeline-grader-delta">▲ 0.06</span> : null}
      </div>
      <p className="pipeline-grader-meta">48 / 50 hidden tests passed</p>
      <div className="pipeline-grader-bars">
        {Array.from({ length: 25 }, (_, i) => (
          <span
            key={i}
            className={cn(
              "pipeline-grader-bar",
              i < barsVisible && (i === 7 || i === 19 ? "is-fail" : "is-pass"),
            )}
          />
        ))}
      </div>
    </div>
  );
}

export const LAYER_LABELS = [
  { num: "01", name: "Corpus", sub: "chunked + embedded", accentNum: false },
  { num: "02", name: "Retriever", sub: "hybrid · rerank", accentNum: false },
  { num: "03", name: "Generator", sub: "cites sources", accentNum: false },
  { num: "04", name: "Grader", sub: "hidden test set", accentNum: true },
] as const;

export type PipelineTrack = "rag" | "eval" | "guard" | "prompt";

export function trackHighlightsLayer(track: PipelineTrack | null, layerIndex: number): boolean {
  if (!track) return true;
  const map: Record<PipelineTrack, number[] | "all"> = {
    rag: "all",
    eval: [3],
    guard: [2],
    prompt: [2],
  };
  const hit = map[track];
  return hit === "all" || hit.includes(layerIndex);
}

export function RetrieverChipIcon() {
  return <Activity className="pipeline-chip-activity" strokeWidth={2} aria-hidden />;
}
