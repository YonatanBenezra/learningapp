"use client";

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  CorpusFace,
  GeneratorFace,
  GraderFace,
  LAYER_LABELS,
  RetrieverChipIcon,
  RetrieverFace,
  trackHighlightsLayer,
  type PipelineTrack,
} from "./layers";
import { PipelineStackSceneBackdrop } from "./pipeline-stack-scene-backdrop";
import "./pipeline-stack-3d.css";

const STAGE_W = 640;
const STAGE_H = 660;
const ISO_X = 260;
const SLAB_DY = 9;

/** Layer index: 0 Corpus … 3 Grader — expanded diamond top Y. */
const EXP_TOP = [381, 269, 157, 45] as const;
/** translateY when fully collapsed (spread = 0). */
const COLL_DY = [-117, -39, 39, 117] as const;
/** Layer center Y (expanded). */
const CENTER_Y = [506, 394, 282, 170] as const;
const PARALLAX_DEPTH = [0, 4, 8, 12] as const;

const ISO_MATRIX = (y: number) => `matrix(0.866, 0.5, -0.866, 0.5, ${ISO_X}, ${y})`;

type RunPhase = "queued" | "grading" | "passed";

export type PipelineStack3DProps = {
  activeTrack?: PipelineTrack | null;
  className?: string;
  offsetY?: number;
};

function spreadOffset(spread: number, index: number) {
  return COLL_DY[index] * (1 - spread);
}

export function PipelineStack3D({
  activeTrack = null,
  className,
  offsetY = 0,
}: PipelineStack3DProps) {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: 0.3, once: false });

  const [spread, setSpread] = useState(1);
  const [score, setScore] = useState(0.94);
  const [barsVisible, setBarsVisible] = useState(25);
  const [graderBorderOpacity, setGraderBorderOpacity] = useState(0.7);
  const [stackGlowStrength, setStackGlowStrength] = useState(0.28);
  const [runPhase, setRunPhase] = useState<RunPhase>("passed");
  const [labelsVisible, setLabelsVisible] = useState(true);

  const parallaxX = useMotionValue(0);
  const parallaxY = useMotionValue(0);
  const springX = useSpring(parallaxX, { stiffness: 80, damping: 20 });
  const springY = useSpring(parallaxY, { stiffness: 80, damping: 20 });

  const timeoutsRef = useRef<number[]>([]);
  const scoreAnimStop = useRef<(() => void) | null>(null);

  const clearTimers = useCallback(() => {
    timeoutsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutsRef.current = [];
    scoreAnimStop.current?.();
    scoreAnimStop.current = null;
  }, []);

  const queue = useCallback((fn: () => void, ms: number) => {
    timeoutsRef.current.push(window.setTimeout(fn, ms));
  }, []);

  const runScoreAnim = useCallback(() => {
    scoreAnimStop.current?.();
    const first = animate(0, 0.88, {
      duration: 0.75,
      ease: [0.2, 0, 0, 1],
      onUpdate: (v) => setScore(v),
    });
    scoreAnimStop.current = () => first.stop();
    first.then(() => {
      const second = animate(0.88, 0.94, {
        duration: 0.45,
        ease: [0.2, 0, 0, 1],
        onUpdate: (v) => setScore(v),
      });
      scoreAnimStop.current = () => second.stop();
    });
  }, []);

  const runBarsAnim = useCallback(() => {
    setBarsVisible(0);
    for (let i = 0; i < 25; i += 1) {
      queue(() => setBarsVisible(i + 1), i * 20);
    }
  }, [queue]);

  const restState = useCallback(() => {
    setScore(0.94);
    setBarsVisible(25);
    setGraderBorderOpacity(0.7);
    setStackGlowStrength(0.28);
    setRunPhase("passed");
    setSpread(1);
    setLabelsVisible(true);
  }, []);

  const startLoop = useCallback(() => {
    clearTimers();
    setSpread(0);
    setScore(0.94);
    setBarsVisible(25);
    setGraderBorderOpacity(0.25);
    setStackGlowStrength(0.12);
    setRunPhase("queued");
    setLabelsVisible(false);

    queue(() => {
      setSpread(1);
      setLabelsVisible(true);
    }, 600);

    queue(() => {
      setRunPhase("grading");
      setScore(0);
      setBarsVisible(0);
    }, 1500);

    queue(() => {
      setGraderBorderOpacity(0.7);
      setStackGlowStrength(0.28);
      setRunPhase("passed");
      runScoreAnim();
      runBarsAnim();
    }, 2400);

    queue(() => {
      setSpread(0);
      setGraderBorderOpacity(0.25);
      setStackGlowStrength(0.12);
      setLabelsVisible(false);
      setRunPhase("queued");
    }, 5600);

    queue(() => {
      restState();
      startLoop();
    }, 6500);
  }, [clearTimers, queue, restState, runBarsAnim, runScoreAnim]);

  useEffect(() => {
    if (reduceMotion) {
      restState();
      return;
    }
    if (!inView) {
      clearTimers();
      return;
    }
    const boot = window.setTimeout(() => startLoop(), 2800);
    timeoutsRef.current.push(boot);
    return clearTimers;
  }, [reduceMotion, inView, startLoop, clearTimers, restState]);

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || window.matchMedia("(pointer: coarse)").matches) return;
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const py = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    parallaxX.set(px);
    parallaxY.set(py);
  };

  const onPointerLeave = () => {
    parallaxX.set(0);
    parallaxY.set(0);
  };

  const showDelta = score >= 0.94 - 0.001;

  const layerMotionY = (index: number) => spreadOffset(spread, index);
  const beamTop = CENTER_Y[3] + spreadOffset(spread, 3);
  const beamHeight =
    CENTER_Y[0] + spreadOffset(spread, 0) - (CENTER_Y[3] + spreadOffset(spread, 3));

  const lowerFaces = [
    { key: "corpus", Face: CorpusFace },
    { key: "retriever", Face: RetrieverFace },
    { key: "generator", Face: GeneratorFace },
  ] as const;

  return (
    <div
      ref={rootRef}
      className={cn("pipeline-stack-root", className)}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <p className="pipeline-stack-sr">
        RAG pipeline: corpus chunks, retriever, generator with citations, grader scoring 0.94 on
        hidden tests.
      </p>

      <div className="pipeline-stack-scale-wrap">
        <div
          className="pipeline-stack-stage"
          style={{ width: STAGE_W, height: STAGE_H, marginTop: offsetY }}
        >
          <PipelineStackSceneBackdrop />

          <div className="pipeline-stack-floor-shadow" aria-hidden />

          {lowerFaces.map(({ key, Face }, index) => {
            return (
              <LayerMotionGroup
                key={`slab-face-${key}`}
                index={index}
                motionY={layerMotionY(index)}
                springX={springX}
                springY={springY}
                className="pipeline-layer-group"
              >
                <div
                  className="pipeline-iso-slab"
                  style={{ transform: ISO_MATRIX(EXP_TOP[index] + SLAB_DY) }}
                />
                <div
                  className="pipeline-iso-face"
                  style={{ transform: ISO_MATRIX(EXP_TOP[index]) }}
                >
                  <Face />
                </div>
              </LayerMotionGroup>
            );
          })}

          <motion.div
            className="pipeline-stack-beam"
            aria-hidden
            animate={{ top: beamTop, height: beamHeight }}
            transition={{
              type: "spring",
              stiffness: 120,
              damping: 20,
            }}
            style={{ left: 259 }}
          />

          {[0, 1, 2].map((index) => (
            <LayerMotionGroup
              key={`node-${index}`}
              index={index}
              motionY={layerMotionY(index)}
              springX={springX}
              springY={springY}
            >
              <span
                className="pipeline-stack-node"
                style={{ left: ISO_X, top: CENTER_Y[index] }}
                aria-hidden
              />
            </LayerMotionGroup>
          ))}

          <LayerMotionGroup
            index={3}
            motionY={layerMotionY(3)}
            springX={springX}
            springY={springY}
          >
            <motion.div
              className="pipeline-stack-grader-cast"
              style={{ left: ISO_X, top: CENTER_Y[3] + 36 }}
              animate={{ opacity: stackGlowStrength }}
              transition={{ duration: 0.6 }}
              aria-hidden
            />
            <div className="pipeline-iso-slab" style={{ transform: ISO_MATRIX(EXP_TOP[3] + SLAB_DY) }} />
            <div
              className={cn("pipeline-iso-face pipeline-iso-face--grader")}
              style={{
                transform: ISO_MATRIX(EXP_TOP[3]),
                ["--grader-border-opacity" as string]: graderBorderOpacity,
              }}
            >
              <GraderFace
                score={score.toFixed(2)}
                barsVisible={barsVisible}
                showDelta={showDelta}
              />
            </div>
            <span
              className="pipeline-stack-node"
              style={{ left: ISO_X, top: CENTER_Y[3] }}
              aria-hidden
            />
          </LayerMotionGroup>

          {LAYER_LABELS.map((label, index) => {
            const highlighted = trackHighlightsLayer(activeTrack, index);
            const dimTrack = activeTrack !== null && !highlighted;
            return (
              <LayerMotionGroup
                key={`label-${label.num}`}
                index={index}
                motionY={layerMotionY(index)}
                springX={springX}
                springY={springY}
                className="pipeline-label-group"
              >
                <div
                  className={cn(
                    "pipeline-side-label",
                    labelsVisible && "is-visible",
                    dimTrack && "is-muted",
                  )}
                  style={{ left: 487, top: CENTER_Y[index] }}
                >
                  <span className="pipeline-side-line" aria-hidden />
                  <div className="pipeline-side-text">
                    <p className="pipeline-side-title">
                      <span
                        className={cn(
                          "pipeline-side-num",
                          label.accentNum && "is-accent",
                        )}
                      >
                        {label.num}
                      </span>
                      <span className="pipeline-side-name">{label.name}</span>
                    </p>
                    <p className="pipeline-side-sub">{label.sub}</p>
                  </div>
                </div>
              </LayerMotionGroup>
            );
          })}

          <LayerMotionGroup
            index={3}
            motionY={layerMotionY(3)}
            springX={springX}
            springY={springY}
            className="pipeline-chip-group"
          >
            <span className="pipeline-float-chip" style={{ left: 20, top: EXP_TOP[3] + 20 }}>
              <span
                className={cn(
                  "pipeline-float-dot",
                  runPhase === "passed" ? "is-teal" : "is-amber",
                )}
              />
              run #214 · {runPhase === "grading" ? "grading…" : runPhase}
            </span>
          </LayerMotionGroup>

          <LayerMotionGroup
            index={1}
            motionY={layerMotionY(1)}
            springX={springX}
            springY={springY}
            className="pipeline-chip-group"
          >
            <span className="pipeline-float-chip" style={{ left: 0, top: EXP_TOP[1] + 150 }}>
              <RetrieverChipIcon />
              retrieve.top_k=5 · 182ms
            </span>
          </LayerMotionGroup>
        </div>
      </div>
    </div>
  );
}

function LayerMotionGroup({
  index,
  motionY,
  springX,
  springY,
  className,
  children,
}: {
  index: number;
  motionY: number;
  springX: MotionValue<number>;
  springY: MotionValue<number>;
  className?: string;
  children: ReactNode;
}) {
  const depth = PARALLAX_DEPTH[index];
  const shiftX = useTransform(springX, (v) => v * depth);
  const shiftY = useTransform(springY, (v) => v * depth);

  return (
    <motion.div
      className={cn("pipeline-motion-group", className)}
      animate={{ y: motionY }}
      transition={{
        type: "spring",
        stiffness: 120,
        damping: 20,
        delay: index * 0.06,
      }}
    >
      <motion.div className="pipeline-parallax-inner" style={{ x: shiftX, y: shiftY }}>
        {children}
      </motion.div>
    </motion.div>
  );
}
