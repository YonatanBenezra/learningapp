"use client";

import {
  PointerEvent as ReactPointerEvent,
  ReactNode,
  useCallback,
  useEffect,
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
  primary: ReactNode;
  secondary: ReactNode;
  className?: string;
  primaryCollapsed?: boolean;
  secondaryCollapsed?: boolean;
};

function readRatio(key: string, fallback: number) {
  if (typeof window === "undefined") {
    return fallback;
  }
  const raw = window.localStorage.getItem(key);
  const parsed = raw ? Number(raw) : NaN;
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(0.72, Math.max(0.28, parsed));
}

export function WorkspaceSplit({
  direction = "horizontal",
  storageKey,
  defaultRatio = direction === "horizontal" ? 0.42 : 0.62,
  minPrimary = direction === "horizontal" ? 280 : 220,
  minSecondary = direction === "horizontal" ? 360 : 160,
  primary,
  secondary,
  className = "",
  primaryCollapsed = false,
  secondaryCollapsed = false,
}: WorkspaceSplitProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(defaultRatio);
  const ratioRef = useRef(defaultRatio);
  const dragRef = useRef<{ start: number; startRatio: number; size: number } | null>(
    null,
  );

  useEffect(() => {
    const stored = readRatio(storageKey, defaultRatio);
    ratioRef.current = stored;
    setRatio(stored);
  }, [storageKey, defaultRatio]);

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
      const clamped = Math.min(0.72, Math.max(0.28, nextRatio));
      ratioRef.current = clamped;
      setRatio(clamped);
    },
    [direction, minPrimary, minSecondary],
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
      ? primaryCollapsed
        ? ({ gridTemplateColumns: "3.25rem minmax(0, 1fr)" } as const)
        : ({
            gridTemplateColumns: `${ratio * 100}% 5px minmax(0, 1fr)`,
          } as const)
      : secondaryCollapsed
        ? ({ gridTemplateRows: "minmax(0, 1fr) 2.5rem" } as const)
        : ({
            gridTemplateRows: `${ratio * 100}% 5px minmax(0, 1fr)`,
          } as const);

  const showHandle =
    direction === "horizontal" ? !primaryCollapsed : !secondaryCollapsed;

  return (
    <div
      ref={rootRef}
      className={`lp-ws-split lp-ws-split--${direction}${primaryCollapsed ? " is-primary-collapsed" : ""}${secondaryCollapsed ? " is-secondary-collapsed" : ""}${className ? ` ${className}` : ""}`}
      style={style}
    >
      <div className="lp-ws-split-primary">{primary}</div>
      {showHandle ? (
        <div
          className="lp-ws-split-handle"
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
