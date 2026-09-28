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

  useLayoutEffect(() => {
    const stored = readRatio(storageKey, defaultRatio, ratioMin, ratioMax);
    ratioRef.current = stored;
    setRatio((prev) => (prev === stored ? prev : stored));
  }, [storageKey, defaultRatio, ratioMin, ratioMax]);

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
        startRatio: ratio,
        size,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [direction, ratio],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag) {
        return;
      }
      const delta =
        (direction === "horizontal" ? event.clientX : event.clientY) - drag.start;
      const nextRatio = drag.startRatio + delta / drag.size;
      const primaryPx = nextRatio * drag.size;
      const secondaryPx = drag.size - primaryPx;
      if (primaryPx < minPrimary || secondaryPx < minSecondary) {
        return;
      }
      const clamped = Math.min(ratioMax, Math.max(ratioMin, nextRatio));
      ratioRef.current = clamped;
      setRatio(clamped);
    },
    [direction, minPrimary, minSecondary, ratioMin, ratioMax],
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragRef.current) {
        return;
      }
      dragRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
      window.localStorage.setItem(storageKey, String(ratioRef.current));
    },
    [storageKey],
  );

  const style =
    direction === "horizontal"
      ? secondaryCollapsed
        ? ({ gridTemplateColumns: "minmax(0, 1fr) 3.25rem" } as const)
        : primaryCollapsed
          ? ({ gridTemplateColumns: "3.25rem minmax(0, 1fr)" } as const)
          : ({
              gridTemplateColumns: `minmax(0, ${ratio * 100}%) 9px minmax(0, 1fr)`,
            } as const)
      : secondaryCollapsed
        ? ({ gridTemplateRows: "minmax(0, 1fr) 2.5rem" } as const)
        : ({
            gridTemplateRows: `${ratio * 100}% 9px minmax(0, 1fr)`,
          } as const);

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
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
      ) : null}
      <div className="lp-ws-split-secondary">{secondary}</div>
    </div>
  );
}
