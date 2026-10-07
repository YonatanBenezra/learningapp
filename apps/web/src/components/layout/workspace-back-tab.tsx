"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { routes } from "@/config/routes";

const STORAGE_KEY = "labpath.ws-back-tab-y";
const MIN_Y = 0.1;
const MAX_Y = 0.9;
const DEFAULT_Y = 0.36;
const DRAG_THRESHOLD_PX = 6;

function workspaceHeightPx() {
  if (typeof window === "undefined") {
    return 1;
  }
  const top = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue("--lp-ws-viewport-top"),
  );
  const insetTop = Number.isFinite(top) ? top : 0;
  return Math.max(1, window.innerHeight - insetTop);
}

type WorkspaceBackTabProps = {
  href?: string;
};

/** Left-edge back tab — drag vertically; tap navigates when not dragging. */
export function WorkspaceBackTab({ href = routes.problems }: WorkspaceBackTabProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [yRatio, setYRatio] = useState(DEFAULT_Y);
  const yRatioRef = useRef(DEFAULT_Y);
  const dragRef = useRef({
    pointerDown: false,
    moved: false,
    startClientY: 0,
    startRatio: DEFAULT_Y,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    yRatioRef.current = yRatio;
  }, [yRatio]);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (!saved) {
        return;
      }
      const parsed = Number(saved);
      if (!Number.isFinite(parsed)) {
        return;
      }
      const clamped = Math.min(MAX_Y, Math.max(MIN_Y, parsed));
      setYRatio(clamped);
      yRatioRef.current = clamped;
    } catch {
      /* ignore */
    }
  }, []);

  const persistY = useCallback((value: number) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      /* ignore */
    }
  }, []);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0) {
        return;
      }
      dragRef.current = {
        pointerDown: true,
        moved: false,
        startClientY: event.clientY,
        startRatio: yRatioRef.current,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [],
  );

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current.pointerDown || !event.currentTarget.hasPointerCapture(event.pointerId)) {
      return;
    }
    const dy = event.clientY - dragRef.current.startClientY;
    if (Math.abs(dy) >= DRAG_THRESHOLD_PX) {
      dragRef.current.moved = true;
    }
    const next = dragRef.current.startRatio + dy / workspaceHeightPx();
    const clamped = Math.min(MAX_Y, Math.max(MIN_Y, next));
    setYRatio(clamped);
    yRatioRef.current = clamped;
  }, []);

  const finishPointer = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (!dragRef.current.pointerDown) {
        return;
      }
      dragRef.current.pointerDown = false;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      persistY(yRatioRef.current);
      if (!dragRef.current.moved) {
        router.push(href);
      }
      dragRef.current.moved = false;
    },
    [href, persistY, router],
  );

  const tab = (
    <button
      type="button"
      className="lp-ws-back-tab"
      style={{
        top: `calc(var(--lp-ws-viewport-top, 0px) + (100vh - var(--lp-ws-viewport-top, 0px)) * ${yRatio})`,
      }}
      aria-label="Back to problems"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finishPointer}
      onPointerCancel={finishPointer}
    >
      <ArrowLeft className="size-[1.45rem]" strokeWidth={2.35} aria-hidden />
    </button>
  );

  if (!mounted) {
    return null;
  }

  return createPortal(tab, document.body);
}
