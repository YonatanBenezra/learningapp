"use client";

import {
  BaseEdge,
  getBezierPath,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";

const LIT = "#2dd4bf";

function midChevron(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
) {
  const mx = (sourceX + targetX) / 2;
  const my = (sourceY + targetY) / 2;
  const angle = (Math.atan2(targetY - sourceY, targetX - sourceX) * 180) / Math.PI;
  return { mx, my, angle };
}

export function RagFlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
}: EdgeProps) {
  const pathInput = {
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  };

  const useSmoothStep = id === "replan";
  const [path] = useSmoothStep
    ? getSmoothStepPath(pathInput)
    : getBezierPath(pathInput);

  const stroke = (style.stroke as string | undefined) ?? "rgba(148, 163, 184, 0.45)";
  const lit = stroke === LIT || (style.strokeWidth as number | undefined) === 2;
  const { mx, my, angle } = midChevron(sourceX, sourceY, targetX, targetY);

  return (
    <>
      <BaseEdge id={id} path={path} style={style} />
      <g
        transform={`translate(${mx}, ${my}) rotate(${angle})`}
        className="lp-rf-edge-chevron"
        aria-hidden
      >
        <path
          d="M -5 -3.25 L 0 0 L -5 3.25"
          fill="none"
          stroke={stroke}
          strokeWidth={lit ? 1.85 : 1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </>
  );
}
