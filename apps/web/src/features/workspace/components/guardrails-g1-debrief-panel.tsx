"use client";

import type { G1Debrief } from "../guardrails-g1-debrief";

type GuardrailsG1DebriefPanelProps = {
  debrief: G1Debrief;
};

export function GuardrailsG1DebriefPanel({ debrief }: GuardrailsG1DebriefPanelProps) {
  return (
    <section className="lp-grd-debrief" aria-labelledby="grd-debrief-title">
      <h2 id="grd-debrief-title" className="lp-grd-debrief-title">
        Defence debrief
      </h2>
      <p className="lp-grd-debrief-summary">{debrief.summary}</p>
      <dl className="lp-grd-debrief-meta">
        <div>
          <dt>Defence</dt>
          <dd>{debrief.defence}</dd>
        </div>
        <div>
          <dt>Technique</dt>
          <dd>{debrief.technique}</dd>
        </div>
        <div>
          <dt>Next level adds</dt>
          <dd>{debrief.nextLevelAdds}</dd>
        </div>
      </dl>
    </section>
  );
}
