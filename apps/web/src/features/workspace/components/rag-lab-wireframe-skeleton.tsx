const ROW_COUNT = 4;

type RagLabWireframeSkeletonProps = {
  showFooter?: boolean;
  rowCount?: number;
};

export function RagLabWireframeSkeleton({
  showFooter = true,
  rowCount = ROW_COUNT,
}: RagLabWireframeSkeletonProps) {
  return (
    <div
      className="lp-rag-lab lp-rag-lab--figma-wireframe"
      aria-busy="true"
      aria-label="Loading simulation lab"
    >
      <div className="lp-rag-lab-seg lp-rag-lab-seg--skel" aria-hidden>
        <span className="lp-rag-lab-wf-skel-seg lp-skel-line" />
        <span className="lp-rag-lab-wf-skel-seg lp-rag-lab-wf-skel-seg--active lp-skel-line" />
        <span className="lp-rag-lab-wf-skel-seg lp-skel-line" />
      </div>

      <ul className="lp-rag-lab-wf-list" aria-hidden>
        {Array.from({ length: rowCount }, (_, index) => (
          <li key={index} className="lp-rag-lab-wf-row lp-rag-lab-wf-row--skel">
            <span className="lp-rag-lab-wf-skel-id lp-skel-line" />
            <span className="lp-rag-lab-wf-skel-title lp-skel-line" />
            <span className="lp-rag-lab-wf-skel-bar lp-skel-line" />
            <span className="lp-rag-lab-wf-skel-tok lp-skel-line" />
          </li>
        ))}
      </ul>

      {showFooter ? (
        <p className="lp-rag-lab-wf-foot">
          Wireframe only: learners browse the corpus, inspect generated chunks and try a public
          query. Not graded.
        </p>
      ) : null}
    </div>
  );
}
