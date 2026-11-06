"use client";

import { Boxes } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { DashboardAppsPanel } from "./dashboard-apps-panel";

type DashboardNavAppsProps = {
  className?: string;
};

export function DashboardNavApps({ className }: DashboardNavAppsProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [anchor, setAnchor] = useState({ top: 0, right: 16 });
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateAnchor = () => {
    const node = triggerRef.current;
    if (!node) {
      return;
    }
    const rect = node.getBoundingClientRect();
    setAnchor({
      top: rect.bottom + 10,
      right: Math.max(12, window.innerWidth - rect.right),
    });
  };

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    updateAnchor();
    window.addEventListener("resize", updateAnchor);
    window.addEventListener("scroll", updateAnchor, true);
    return () => {
      window.removeEventListener("resize", updateAnchor);
      window.removeEventListener("scroll", updateAnchor, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) {
        return;
      }
      if (target instanceof Element && target.closest(".lp-dash-apps-panel")) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className={cn("lp-dash-htb-nav-apps-wrap", open && "is-open", className)}>
      <button
        ref={triggerRef}
        type="button"
        className={cn("lp-dash-htb-nav-icon-btn", open && "is-active")}
        aria-label="LabPath apps"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
      >
        <Boxes className="lp-dash-htb-nav-action-icon" strokeWidth={2} aria-hidden />
      </button>

      {mounted ? (
        <DashboardAppsPanel open={open} anchor={anchor} onClose={() => setOpen(false)} />
      ) : null}
    </div>
  );
}
