"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  cosineLabelForQuery,
  EMBEDDING_FIELD,
  topNearestIds,
  type EmbedPoint,
} from "../auth-embedding-utils";

const E = [0.2, 0, 0, 1] as const;

type AuthEmbeddingFieldProps = {
  className?: string;
};

export function AuthEmbeddingField({ className }: AuthEmbeddingFieldProps) {
  const reduceMotion = useReducedMotion();
  const { points, links, width, height } = EMBEDDING_FIELD;
  const [queryId, setQueryId] = useState(12);
  const [hitIds, setHitIds] = useState<number[]>(() => topNearestIds(points, 12, 5));
  const [cosLabel, setCosLabel] = useState("0.82");
  const [visible, setVisible] = useState(true);
  const loopRef = useRef(0);

  const query = points[queryId];

  useEffect(() => {
    const onVis = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    if (reduceMotion || !visible) return;
    const id = window.setInterval(() => {
      loopRef.current += 1;
      const nextId = Math.floor((loopRef.current * 17) % points.length);
      setQueryId(nextId);
      setHitIds(topNearestIds(points, nextId, 5));
      setCosLabel(cosineLabelForQuery(nextId + loopRef.current));
    }, 4000);
    return () => window.clearInterval(id);
  }, [points, reduceMotion, visible]);

  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <motion.g
        animate={
          reduceMotion
            ? undefined
            : {
                x: [0, 6, -4, 0],
                y: [0, -5, 4, 0],
              }
        }
        transition={
          reduceMotion
            ? undefined
            : { duration: 20, repeat: Infinity, ease: "easeInOut" }
        }
      >
        {links.map((link) => {
          const a = points[link.a];
          const b = points[link.b];
          if (!a || !b) return null;
          return (
            <motion.line
              key={`${link.a}-${link.b}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="rgb(42 53 73 / 80%)"
              strokeWidth={1}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease: E, delay: reduceMotion ? 0 : 0.35 }}
            />
          );
        })}

        {points.map((p, i) => (
          <PointDot
            key={p.id}
            point={p}
            delay={reduceMotion ? 0 : (i % 20) * 0.03}
            active={hitIds.includes(p.id)}
            isQuery={p.id === queryId}
          />
        ))}

        {query ? (
          <>
            {hitIds.map((id, index) => {
              const target = points[id];
              if (!target) return null;
              return (
                <motion.line
                  key={`q-${queryId}-${id}`}
                  x1={query.x}
                  y1={query.y}
                  x2={target.x}
                  y2={target.y}
                  stroke="rgb(45 212 191 / 75%)"
                  strokeWidth={1.25}
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.35,
                    ease: E,
                    delay: reduceMotion ? 0 : index * 0.06,
                  }}
                />
              );
            })}
            <motion.circle
              cx={query.x}
              cy={query.y}
              r={9}
              fill="#2dd4bf"
              animate={reduceMotion ? undefined : { cx: query.x, cy: query.y }}
              transition={{ duration: 0.8, ease: E }}
            />
            <circle cx={query.x} cy={query.y} r={14} fill="rgb(45 212 191 / 35%)" />
            <text
              x={query.x + 14}
              y={query.y - 10}
              fill="#6a7487"
              fontSize={10}
              fontFamily="var(--lp-font-mono, monospace)"
            >
              query · top-5 · cos {cosLabel}
            </text>
          </>
        ) : null}
      </motion.g>
    </svg>
  );
}

function PointDot({
  point,
  delay,
  active,
  isQuery,
}: {
  point: EmbedPoint;
  delay: number;
  active: boolean;
  isQuery: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const r = active ? 6 : 2 + (point.id % 3);
  const fill = active ? "#2dd4bf" : "#6a7487";

  if (isQuery) return null;

  return (
    <motion.circle
      cx={point.x}
      cy={point.y}
      r={r}
      fill={fill}
      fillOpacity={active ? 1 : point.opacity}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.6 }}
      animate={
        active && !reduceMotion
          ? { opacity: 1, scale: [1, 1.5, 1] }
          : { opacity: point.opacity, scale: 1 }
      }
      transition={{
        opacity: { duration: 0.5, delay },
        scale: active ? { duration: 0.35, ease: E } : { duration: 0.2 },
      }}
    />
  );
}
