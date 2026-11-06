"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { workspaceAppGroups } from "@/config/product-nav";

type DashboardAppsPanelProps = {
  open: boolean;
  anchor: { top: number; right: number };
  onClose: () => void;
};

const E = [0.2, 0, 0, 1] as const;

export function DashboardAppsPanel({ open, anchor, onClose }: DashboardAppsPanelProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            className="lp-dash-updates-scrim"
            aria-label="Close apps menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.nav
            aria-label="LabPath apps"
            className="lp-dash-apps-panel"
            style={{ top: anchor.top, right: anchor.right }}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.99 }}
            transition={{ duration: 0.22, ease: E }}
          >
            <ul className="lp-dash-apps-list">
              {workspaceAppGroups.map((group, groupIndex) =>
                group.items.map((app, itemIndex) => (
                  <li
                    key={app.id}
                    className={
                      groupIndex > 0 && itemIndex === 0 ? "lp-dash-apps-list-section-start" : undefined
                    }
                  >
                    <Link href={app.href} className="lp-dash-apps-link" onClick={onClose}>
                      <span className="lp-dash-apps-link-title">{app.label}</span>
                      <span className="lp-dash-apps-link-sub">{app.description}</span>
                    </Link>
                  </li>
                )),
              )}
            </ul>
          </motion.nav>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
