import { BookOpen, Radio } from "lucide-react";
import { LIVE_RAG_PROBLEMS } from "@/config/live-rag-problems";
import { RAG_TRACK_CLEARED, RAG_TRACK_TOTAL } from "../problems-figma-meta";

export function ProblemsRagTrackPanel() {
  return (
    <aside className="lp-prob-track" aria-label="RAG track progress">
      <p className="lp-prob-track-kicker">RAG track</p>
      <div className="lp-prob-track-headline">
        <p className="lp-prob-track-ratio">
          {RAG_TRACK_CLEARED} / {RAG_TRACK_TOTAL}
        </p>
        <p className="lp-prob-track-sub">problems cleared</p>
      </div>

      <div className="lp-prob-track-dots" aria-hidden>
        {Array.from({ length: RAG_TRACK_TOTAL }, (_, i) => (
          <span key={i} className={i < RAG_TRACK_CLEARED ? "is-on" : undefined} />
        ))}
      </div>

      <ul className="lp-prob-track-levels">
        {LIVE_RAG_PROBLEMS.map((problem) => (
          <li key={problem.slug}>
            <span className="lp-prob-track-icon lp-prob-track-icon--todo" aria-hidden>
              <Radio className="size-3" strokeWidth={2} />
            </span>
            <span className="lp-prob-track-level-label">
              {problem.id} · {problem.title}
            </span>
            <span className="lp-prob-track-level-state is-not_started">not started</span>
          </li>
        ))}
      </ul>

      <div className="lp-prob-track-ref">
        <BookOpen className="size-3.5 shrink-0 opacity-70" strokeWidth={2} aria-hidden />
        <span>Chunk → retrieve → rerank → cite</span>
      </div>
    </aside>
  );
}
