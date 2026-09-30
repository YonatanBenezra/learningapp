"use client";

import {
  PointerEvent as ReactPointerEvent,
  ReactNode,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

type SplitDirection = "horizontal" | "vertical";

type WorkspaceSplitProps = {
  direction?: SplitDirection;
  storageKey: string;
  defaultRatio?: number;
  minPrimary?: number;
  minSecondary?: number;
  ratioMin?: number;
  ratioMax?: number;
  handleVariant?: "default" | "pill";
  primary: ReactNode;
  secondary: ReactNode;
  className?: string;
  primaryCollapsed?: boolean;
  secondaryCollapsed?: boolean;
};

function readRatio(key: string, fallback: number, min: number, max: number) {
  if (typeof window === "undefined") {
    return fallback;
  }
  const raw = window.localStorage.getItem(key);
  const parsed = raw ? Number(raw) : NaN;
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, parsed));
}

let splitDragDepth = 0;

function beginSplitDrag() {
  splitDragDepth += 1;
  if (splitDragDepth === 1 && typeof document !== "undefined") {
    document.documentElement.classList.add("lp-ws-split-drag");
  }
}

function endSplitDrag() {
  splitDragDepth = Math.max(0, splitDragDepth - 1);
  if (splitDragDepth === 0 && typeof document !== "undefined") {
    document.documentElement.classList.remove("lp-ws-split-drag");
    window.dispatchEvent(new CustomEvent("lp-ws-split-resize-end"));
  }
}

function gridStyleForRatio(
  direction: SplitDirection,
  ratio: number,
): { gridTemplateColumns?: string; gridTemplateRows?: string } {
  if (direction === "horizontal") {
    return {
      gridTemplateColumns: `minmax(0, ${ratio * 100}%) 9px minmax(0, 1fr)`,
    };
  }
  return {
    gridTemplateRows: `${ratio * 100}% 9px minmax(0, 1fr)`,
  };
}

export function WorkspaceSplit({
  direction = "horizontal",
  storageKey,
  defaultRatio = direction === "horizontal" ? 0.42 : 0.62,
  minPrimary = direction === "horizontal" ? 280 : 220,
  minSecondary = direction === "horizontal" ? 360 : 160,
  ratioMin = 0.22,
  ratioMax = 0.78,
  handleVariant = "default",
  primary,
  secondary,
  className = "",
  primaryCollapsed = false,
  secondaryCollapsed = false,
}: WorkspaceSplitProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(() =>
    readRatio(storageKey, defaultRatio, ratioMin, ratioMax),
  );
  const ratioRef = useRef(ratio);
  const dragRef = useRef<{ start: number; startRatio: number; size: number } | null>(
    null,
  );
  const rafRef = useRef<number | null>(null);
  const pendingRatioRef = useRef<number | null>(null);

  const applyRatioToDom = useCallback(
    (next: number) => {
      const root = rootRef.current;
      if (!root) {
        return;
      }
      const grid = gridStyleForRatio(direction, next);
      if (grid.gridTemplateColumns) {
        root.style.gridTemplateColumns = grid.gridTemplateColumns;
      }
      if (grid.gridTemplateRows) {
        root.style.gridTemplateRows = grid.gridTemplateRows;
      }
    },
    [direction],
  );

  useLayoutEffect(() => {
    const stored = readRatio(storageKey, defaultRatio, ratioMin, ratioMax);
    ratioRef.current = stored;
    setRatio((prev) => (prev === stored ? prev : stored));
  }, [storageKey, defaultRatio, ratioMin, ratioMax]);

  useLayoutEffect(() => {
    if (dragRef.current) {
      return;
    }
    if (primaryCollapsed || secondaryCollapsed) {
      return;
    }
    applyRatioToDom(ratio);
  }, [
    ratio,
    primaryCollapsed,
    secondaryCollapsed,
    applyRatioToDom,
  ]);

  const commitRatio = useCallback(
    (clamped: number) => {
      ratioRef.current = clamped;
      pendingRatioRef.current = null;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      applyRatioToDom(clamped);
      setRatio(clamped);
      window.localStorage.setItem(storageKey, String(clamped));
    },
    [applyRatioToDom, storageKey],
  );

  const scheduleRatioDuringDrag = useCallback(
    (clamped: number) => {
      ratioRef.current = clamped;
      pendingRatioRef.current = clamped;
      if (rafRef.current !== null) {
        return;
      }
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const next = pendingRatioRef.current;
        if (next === null) {
          return;
        }
        applyRatioToDom(next);
      });
    },
    [applyRatioToDom],
  );

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const root = rootRef.current;
      if (!root) {
        return;
      }
      event.preventDefault();
      const rect = root.getBoundingClientRect();
      const size = direction === "horizontal" ? rect.width : rect.height;
      dragRef.current = {
        start: direction === "horizontal" ? event.clientX : event.clientY,
        startRatio: ratioRef.current,
        size,
      };
      beginSplitDrag();
      root.classList.add("is-resizing");

      const onMove = (moveEvent: PointerEvent) => {
        const drag = dragRef.current;
        if (!drag) {
          return;
        }
        const delta =
          (direction === "horizontal" ? moveEvent.clientX : moveEvent.clientY) -
          drag.start;
        const nextRatio = drag.startRatio + delta / drag.size;
        const primaryPx = nextRatio * drag.size;
        const secondaryPx = drag.size - primaryPx;
        if (primaryPx < minPrimary || secondaryPx < minSecondary) {
          return;
        }
        const clamped = Math.min(ratioMax, Math.max(ratioMin, nextRatio));
        scheduleRatioDuringDrag(clamped);
      };

      const onUp = (upEvent: PointerEvent) => {
        dragRef.current = null;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        root.classList.remove("is-resizing");
        endSplitDrag();
        commitRatio(ratioRef.current);
        upEvent.preventDefault();
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [
      direction,
      minPrimary,
      minSecondary,
      ratioMin,
      ratioMax,
      scheduleRatioDuringDrag,
      commitRatio,
    ],
  );

  const collapsed =
    direction === "horizontal"
      ? primaryCollapsed || secondaryCollapsed
      : secondaryCollapsed;

  const style = collapsed
    ? direction === "horizontal"
      ? secondaryCollapsed
        ? ({ gridTemplateColumns: "minmax(0, 1fr) 3.25rem" } as const)
        : ({ gridTemplateColumns: "3.25rem minmax(0, 1fr)" } as const)
      : ({ gridTemplateRows: "minmax(0, 1fr) 2.5rem" } as const)
    : undefined;

  const showHandle =
    direction === "horizontal"
      ? !primaryCollapsed && !secondaryCollapsed
      : !secondaryCollapsed;

  return (
    <div
      ref={rootRef}
      className={`lp-ws-split lp-ws-split--${direction}${handleVariant === "pill" ? " lp-ws-split--pill-handle" : ""}${primaryCollapsed ? " is-primary-collapsed" : ""}${secondaryCollapsed ? " is-secondary-collapsed" : ""}${className ? ` ${className}` : ""}`}
      style={style}
    >
      <div className="lp-ws-split-primary">{primary}</div>
      {showHandle ? (
        <div
          className={`lp-ws-split-handle${handleVariant === "pill" ? " lp-ws-split-handle--pill" : ""}`}
          role="separator"
          aria-orientation={direction === "horizontal" ? "vertical" : "horizontal"}
          aria-label={
            direction === "horizontal"
              ? "Resize problem panel"
              : "Resize results panel"
          }
          onPointerDown={onPointerDown}
        />
      ) : null}
      <div className="lp-ws-split-secondary">{secondary}</div>
    </div>
  );
}
