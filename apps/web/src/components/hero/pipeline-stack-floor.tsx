"use client";

const GRID_SIZE = 1100;
const LINE_COUNT = 25;
const LINE_STEP = 45.8;

function lineOpacity(index: number) {
  return 0.55 * (1 - Math.abs(index - 12) / 12);
}

const GRID_LINES = Array.from({ length: LINE_COUNT }, (_, i) => {
  const p = i * LINE_STEP;
  const opacity = lineOpacity(i);
  return { i, p, opacity };
});

export function PipelineStackFloorGrid() {
  return (
    <svg
      className="pipeline-stack-floor-grid-svg"
      width={GRID_SIZE}
      height={GRID_SIZE}
      viewBox={`0 0 ${GRID_SIZE} ${GRID_SIZE}`}
      aria-hidden
    >
      {GRID_LINES.map(({ i, p, opacity }) => (
        <g key={i}>
          <line
            x1={p}
            y1={0}
            x2={p}
            y2={GRID_SIZE}
            stroke="var(--pipeline-floor-stroke, #2a3549)"
            strokeWidth={1}
            opacity={opacity}
            shapeRendering="crispEdges"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={0}
            y1={p}
            x2={GRID_SIZE}
            y2={p}
            stroke="var(--pipeline-floor-stroke, #2a3549)"
            strokeWidth={1}
            opacity={opacity}
            shapeRendering="crispEdges"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      ))}
    </svg>
  );
}

export const PIPELINE_FLOOR_MATRIX = "matrix(0.6062, 0.35, -0.6062, 0.35, 330, 122)";
