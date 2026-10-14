"use client";

import { motion, useReducedMotion } from "motion/react";
import { PipelineStackFloorGrid, PIPELINE_FLOOR_MATRIX } from "./pipeline-stack-floor";

export function PipelineStackSceneBackdrop() {
  const reduceMotion = useReducedMotion();

  return (
    <>
      <motion.div
        className="pipeline-stack-iso-floor-wrap"
        initial={reduceMotion ? false : { opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { delay: 0.2, duration: 1.4, ease: [0.2, 0, 0, 1] }
        }
        aria-hidden
      >
        <div
          className="pipeline-stack-iso-floor"
          style={{ transform: PIPELINE_FLOOR_MATRIX }}
        >
          <PipelineStackFloorGrid />
        </div>
      </motion.div>

      <motion.div
        className="pipeline-stack-ember-ambient"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 1.4, ease: [0.2, 0, 0, 1] }}
        aria-hidden
      >
        <motion.div
          className="pipeline-stack-ember-ambient-inner"
          animate={reduceMotion ? undefined : { scale: [1, 1.08, 1] }}
          transition={
            reduceMotion
              ? undefined
              : { duration: 4, repeat: Infinity, ease: "easeInOut" }
          }
        />
      </motion.div>
    </>
  );
}
